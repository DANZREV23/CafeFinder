import { BlogPostRepository, BlogFilters } from '../repositories/blogRepository.js';
import { generateSlug } from '../utils/slug.js';
import { PostStatus, Prisma } from '@prisma/client';
import { sanitizeContent } from '../utils/sanitization.js';
import { EditorialService } from './editorialService.js';
import { RedirectService } from './redirectService.js';

const editorialService = new EditorialService();
const redirectService = new RedirectService();

export class BlogPostService {
  private blogRepository: BlogPostRepository;

  constructor() {
    this.blogRepository = new BlogPostRepository();
  }

  private calculateReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }

  private sanitizePostContent(content: string): string {
    return sanitizeContent(content);
  }

  async getPublishedPosts(filters: BlogFilters = {}) {
    const { posts, total } = await this.blogRepository.findAll({
      ...filters,
      status: PostStatus.PUBLISHED
    });

    return {
      posts: posts.map(post => ({
        ...post,
        readingTime: this.calculateReadingTime(post.content)
      })),
      total
    };
  }

  async getPostBySlug(slug: string, isAdmin: boolean = false) {
    const post = await this.blogRepository.findBySlug(slug);
    if (!post) return null;
    if (!isAdmin && post.status !== PostStatus.PUBLISHED) return null;

    return {
      ...post,
      readingTime: this.calculateReadingTime(post.content)
    };
  }

  async getRelatedPosts(slug: string, category?: string, limit = 3) {
    const currentPost = await this.blogRepository.findBySlug(slug);
    if (!currentPost) return [];

    const { posts } = await this.blogRepository.findAll({
      status: PostStatus.PUBLISHED,
      category: category || currentPost.category || undefined,
      limit,
      excludeId: currentPost.id
    });

    return posts.map(post => ({
      ...post,
      readingTime: this.calculateReadingTime(post.content)
    }));
  }

  // Admin Methods
  async getAdminPosts(filters: BlogFilters) {
    return this.blogRepository.findAll(filters);
  }

  async getPostById(id: string) {
    return this.blogRepository.findById(id);
  }

  async createPost(data: any, authorId: string) {
    const slug = generateSlug(data.title);
    
    // Ensure slug uniqueness
    let finalSlug = slug;
    let count = 1;
    while (await this.blogRepository.findBySlug(finalSlug)) {
      finalSlug = `${slug}-${++count}`;
    }

    const sanitizedContent = this.sanitizePostContent(data.content);
    const status: PostStatus = data.status || PostStatus.DRAFT;
    const publishedAt = status === PostStatus.PUBLISHED ? new Date() : null;
    const scheduledAt = status === PostStatus.SCHEDULED && data.scheduledAt
      ? new Date(data.scheduledAt)
      : (data.scheduledAt ? new Date(data.scheduledAt) : null);

    const post = await this.blogRepository.create({
      title: data.title,
      slug: finalSlug,
      excerpt: data.excerpt,
      content: sanitizedContent,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      category: data.category,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      author: { connect: { id: authorId } },
      status,
      publishedAt,
      scheduledAt
    });

    // Create initial revision
    await editorialService.createRevision({
      entityType: 'BlogPost',
      entityId: post.id,
      snapshot: post,
      authorId
    });

    return post;
  }

  async updatePost(id: string, data: any, authorId?: string) {
    const post = await this.blogRepository.findById(id);
    if (!post) throw new Error('Post not found');

    const status = data.status !== undefined ? (data.status as PostStatus) : undefined;
    let scheduledAt = undefined;
    if (data.scheduledAt !== undefined) {
      scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }

    const updateData: Prisma.BlogPostUpdateInput = {
      title: data.title,
      excerpt: data.excerpt,
      content: data.content ? this.sanitizePostContent(data.content) : undefined,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      category: data.category,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      status: status !== undefined ? status : undefined,
      scheduledAt: scheduledAt !== undefined ? scheduledAt : undefined,
      updatedAt: new Date(),
      coverImageAsset: data.coverImageId ? { connect: { id: data.coverImageId } } : undefined
    };

    if (status === PostStatus.PUBLISHED && !post.publishedAt) {
      updateData.publishedAt = new Date();
    }

    if (data.title && post.status === PostStatus.DRAFT) {
      updateData.slug = generateSlug(data.title);
    } else if (data.slug && data.slug !== post.slug) {
      // Create redirect if slug changes on a non-draft post
      if (post.status === PostStatus.PUBLISHED) {
        await redirectService.createRedirect(`/blog/${post.slug}`, `/blog/${data.slug}`);
      }
      updateData.slug = data.slug;
    }

    const updatedPost = await this.blogRepository.update(id, updateData);

    // Create revision
    await editorialService.createRevision({
      entityType: 'BlogPost',
      entityId: id,
      snapshot: updatedPost,
      authorId
    });

    return updatedPost;
  }

  async updateStatus(id: string, status: PostStatus, authorId?: string) {
    const post = await this.blogRepository.findById(id);
    if (!post) throw new Error('Post not found');

    const data: Prisma.BlogPostUpdateInput = { status };
    if (status === PostStatus.PUBLISHED && !post.publishedAt) {
      data.publishedAt = new Date();
    }
    const updated = await this.blogRepository.update(id, data);

    await editorialService.createRevision({
      entityType: 'BlogPost',
      entityId: id,
      snapshot: updated,
      authorId
    });

    return updated;
  }

  async deletePost(id: string) {
    return this.blogRepository.delete(id);
  }
}
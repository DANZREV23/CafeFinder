import { BlogPostRepository, BlogFilters } from '../repositories/blogRepository.js';
import { generateSlug } from '../utils/slug.js';
import { PostStatus, Prisma } from '@prisma/client';
import { sanitizeContent } from '../utils/sanitization.js';

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

  async getPostBySlug(slug: string) {
    const post = await this.blogRepository.findBySlug(slug);
    if (!post || post.status !== PostStatus.PUBLISHED) return null;

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

    return this.blogRepository.create({
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
      status: PostStatus.DRAFT
    });
  }

  async updatePost(id: string, data: any) {
    const updateData: Prisma.BlogPostUpdateInput = {
      title: data.title,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      category: data.category,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      updatedAt: new Date()
    };

    if (data.content) {
      updateData.content = this.sanitizePostContent(data.content);
    }

    if (data.title) {
      // Slugs are usually stable once published, but for drafts we can update
      const post = await this.blogRepository.findById(id);
      if (post && post.status === PostStatus.DRAFT) {
        updateData.slug = generateSlug(data.title);
      }
    }

    return this.blogRepository.update(id, updateData);
  }

  async updateStatus(id: string, status: PostStatus) {
    const data: Prisma.BlogPostUpdateInput = { status };
    if (status === PostStatus.PUBLISHED) {
      data.publishedAt = new Date();
    }
    return this.blogRepository.update(id, data);
  }

  async deletePost(id: string) {
    return this.blogRepository.delete(id);
  }
}

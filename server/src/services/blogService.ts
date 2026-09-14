import { BlogPostRepository, BlogFilters } from '../repositories/blogRepository.js';

export class BlogPostService {
  private blogRepository: BlogPostRepository;

  constructor() {
    this.blogRepository = new BlogPostRepository();
  }

  async getPublishedPosts(limit?: number) {
    return this.blogRepository.findAll({ limit });
  }

  async getPostBySlug(slug: string) {
    return this.blogRepository.findBySlug(slug);
  }
}

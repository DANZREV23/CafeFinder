import { Request, Response, NextFunction } from 'express';
import { BlogPostService } from '../services/blogService.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { PostStatus } from '@prisma/client';

const emptyToUndefined = (val: any) => (val === '' || val === null ? undefined : val);

const getBlogQuerySchema = z.object({
  limit: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => (v ? parseInt(v) : 12))),
  page: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => (v ? parseInt(v) : 1))),
  search: z.preprocess(emptyToUndefined, z.string().optional()),
  category: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.preprocess(emptyToUndefined, z.nativeEnum(PostStatus).optional()),
});

const blogPostSchema = z.object({
  title: z.string().min(2).max(200),
  excerpt: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  content: z.string().min(10),
  coverImage: z.preprocess(emptyToUndefined, z.string().url().optional()),
  coverImageAlt: z.preprocess(emptyToUndefined, z.string().optional()),
  category: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
  metaTitle: z.preprocess(emptyToUndefined, z.string().max(70).optional()),
  metaDescription: z.preprocess(emptyToUndefined, z.string().max(160).optional()),
  canonicalUrl: z.preprocess(emptyToUndefined, z.string().url().optional()),
});

export class BlogPostController {
  private blogService: BlogPostService;

  constructor() {
    this.blogService = new BlogPostService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getBlogQuerySchema.parse(req.query);
      const limit = validatedQuery.limit || 12;
      const offset = ((validatedQuery.page || 1) - 1) * limit;

      const { posts, total } = await this.blogService.getPublishedPosts({
        limit,
        offset,
        search: validatedQuery.search,
        category: validatedQuery.category
      });
      
      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            total,
            page: validatedQuery.page || 1,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const post = await this.blogService.getPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          error: { message: 'Blog post not found or not published' }
        });
      }

      // Get related posts
      const relatedPosts = await this.blogService.getRelatedPosts(slug, post.category || undefined);

      res.json({
        success: true,
        data: {
          post,
          relatedPosts
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin Methods
  getAdminPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getBlogQuerySchema.parse(req.query);
      const limit = validatedQuery.limit || 20;
      const offset = ((validatedQuery.page || 1) - 1) * limit;

      const { posts, total } = await this.blogService.getAdminPosts({
        ...validatedQuery,
        limit,
        offset
      });

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            total,
            page: validatedQuery.page || 1,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = blogPostSchema.parse(req.body);
      const post = await this.blogService.createPost(validatedData, req.user!.id);
      
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = blogPostSchema.partial().parse(req.body);
      const post = await this.blogService.updatePost(id, validatedData);
      
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = z.object({ status: z.nativeEnum(PostStatus) }).parse(req.body);
      
      const post = await this.blogService.updateStatus(id, status);
      
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.blogService.deletePost(id);
      
      res.json({
        success: true,
        message: 'Blog post deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}

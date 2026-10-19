import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { generateSlug } from '../utils/slug.js';
import { PostStatus } from '@prisma/client';

export class CuratedListController {
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;

      const where: any = { status: PostStatus.PUBLISHED };

      const [total, lists] = await Promise.all([
        prisma.curatedList.count({ where }),
        prisma.curatedList.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
          include: {
            _count: { select: { cafes: true } },
            cafes: {
              include: {
                cafe: {
                  include: {
                    photos: { where: { isCover: true }, take: 1 },
                  },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        }),
      ]);

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };

      res.json({
        success: true,
        data: {
          lists,
          pagination,
        },
        lists,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const list = await prisma.curatedList.findUnique({
        where: { slug },
        include: {
          cafes: {
            include: {
              cafe: {
                include: {
                  photos: true,
                  amenities: { include: { amenity: true } },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!list) {
        return res.status(404).json({ success: false, error: { message: 'List not found' } });
      }

      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  };

  getAdminLists = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search as string | undefined;
      const status = req.query.status as PostStatus | undefined;

      const where: any = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, lists] = await Promise.all([
        prisma.curatedList.count({ where }),
        prisma.curatedList.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { cafes: true } },
          },
        }),
      ]);

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };

      res.json({
        success: true,
        data: {
          lists,
          pagination,
        },
        lists,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const list = await prisma.curatedList.findUnique({
        where: { id },
        include: {
          cafes: {
            include: {
              cafe: {
                include: {
                  photos: { take: 1 },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!list) {
        return res.status(404).json({ success: false, error: { message: 'List not found' } });
      }

      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, coverImage, coverImageAlt, featured, status } = req.body;
      const slug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(title);

      const list = await prisma.curatedList.create({
        data: {
          title,
          slug,
          description,
          coverImage,
          coverImageAlt,
          featured: featured || false,
          status: status || PostStatus.DRAFT,
        },
      });

      res.status(201).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, description, coverImage, coverImageAlt, featured, status, slug } = req.body;

      const data: any = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (coverImage !== undefined) data.coverImage = coverImage;
      if (coverImageAlt !== undefined) data.coverImageAlt = coverImageAlt;
      if (featured !== undefined) data.featured = featured;
      if (status !== undefined) data.status = status;
      if (slug !== undefined) data.slug = generateSlug(slug);

      const updated = await prisma.curatedList.update({
        where: { id },
        data,
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.curatedList.delete({ where: { id } });
      res.json({ success: true, message: 'List deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await prisma.curatedList.update({
        where: { id },
        data: { status },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  addCafe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: listId } = req.params;
      const { cafeId, sortOrder = 0, editorialNote } = req.body;

      const item = await prisma.curatedListCafe.create({
        data: {
          listId,
          cafeId,
          sortOrder,
          editorialNote,
        },
        include: {
          cafe: {
            include: { photos: { take: 1 } },
          },
        },
      });

      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  updateCafe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: listId, cafeId } = req.params;
      const { sortOrder, editorialNote } = req.body;

      const item = await prisma.curatedListCafe.update({
        where: {
          listId_cafeId: { listId, cafeId },
        },
        data: {
          sortOrder,
          editorialNote,
        },
      });

      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  removeCafe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: listId, cafeId } = req.params;
      await prisma.curatedListCafe.delete({
        where: {
          listId_cafeId: { listId, cafeId },
        },
      });

      res.json({ success: true, message: 'Cafe removed from list' });
    } catch (error) {
      next(error);
    }
  };
}

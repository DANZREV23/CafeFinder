import { Request, Response } from 'express';
import { cafeService } from '../services/cafe.service.js';

export const getCafes = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const result = await cafeService.getAllCafes(page, limit);

    res.json({
      success: true,
      data: result.cafes,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching cafes:', error);
    res.status(500).json({
      success: false,
      error: { message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch cafes' },
    });
  }
};

export const getCafeBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const cafe = await cafeService.getCafeBySlug(slug);

    res.json({
      success: true,
      data: cafe,
    });
  } catch (error: any) {
    if (error.message === 'Cafe not found') {
      return res.status(404).json({
        success: false,
        error: { message: 'Cafe not found' },
      });
    }

    console.error('Error fetching cafe by slug:', error);
    res.status(500).json({
      success: false,
      error: { message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch cafe details' },
    });
  }
};

export const createCafe = async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { message: 'Creation not implemented yet (Authentication required)' },
  });
};

export const updateCafe = async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { message: 'Update not implemented yet (Authentication required)' },
  });
};

export const deleteCafe = async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { message: 'Deletion not implemented yet (Authentication required)' },
  });
};

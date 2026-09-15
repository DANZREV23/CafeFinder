import { Request, Response } from 'express';
import { MenuService } from '../services/menuService.js';
import { prisma } from '../config/database.js';

export class MenuController {
  private service = new MenuService();

  getCafeMenu = async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      console.log(`[MenuController] Fetching menu for cafe slug: ${slug}`);
      const cafe = await prisma.cafe.findUnique({ where: { slug }, select: { id: true } });
      if (!cafe) {
        console.warn(`[MenuController] Cafe not found for slug: ${slug}`);
        return res.status(404).json({ success: false, error: { message: 'Cafe not found' } });
      }

      const menus = await this.service.getCafeMenus(cafe.id, true);
      console.log(`[MenuController] Found ${menus.length} menus for cafe ID: ${cafe.id}`);
      res.json({ success: true, data: menus });
    } catch (e: any) {
      console.error(`[MenuController] Error fetching menu:`, e);
      res.status(400).json({ success: false, error: { message: e.message } });
    }
  };
}

import { MenuRepository } from '../repositories/menuRepository.js';
import { MenuDto, mapToMenuDto } from '../dtos/menuDto.js';
import { Prisma } from '@prisma/client';

export class MenuService {
  private menuRepository: MenuRepository;

  constructor() {
    this.menuRepository = new MenuRepository();
  }

  async getCafeMenus(cafeId: string, publicOnly = true): Promise<MenuDto[]> {
    const menus = await this.menuRepository.findByCafeId(cafeId, publicOnly);
    return menus.map(mapToMenuDto);
  }

  async getMenuById(menuId: string): Promise<MenuDto | null> {
    const menu = await this.menuRepository.findById(menuId);
    if (!menu) return null;
    return mapToMenuDto(menu);
  }

  async createMenu(cafeId: string, data: any): Promise<MenuDto> {
    const menu = await this.menuRepository.create({
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      cafe: { connect: { id: cafeId } }
    });
    return mapToMenuDto(menu);
  }

  async updateMenu(menuId: string, data: any): Promise<MenuDto> {
    const menu = await this.menuRepository.update(menuId, {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      sortOrder: data.sortOrder
    });
    return mapToMenuDto(menu);
  }

  async deleteMenu(menuId: string): Promise<void> {
    await this.menuRepository.delete(menuId);
  }

  // Category
  async createCategory(menuId: string, data: any) {
    return this.menuRepository.createCategory({
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      menu: { connect: { id: menuId } }
    });
  }

  async updateCategory(categoryId: string, data: any) {
    return this.menuRepository.updateCategory(categoryId, {
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder
    });
  }

  async deleteCategory(categoryId: string) {
    await this.menuRepository.deleteCategory(categoryId);
  }

  // Item
  async createItem(categoryId: string, data: any) {
    const { tags, optionGroups, ...rest } = data;
    
    return this.menuRepository.createItem({
      name: rest.name,
      description: rest.description,
      price: new Prisma.Decimal(rest.price),
      imageUrl: rest.imageUrl,
      isAvailable: rest.isAvailable ?? true,
      isFeatured: rest.isFeatured ?? false,
      sortOrder: rest.sortOrder ?? 0,
      category: { connect: { id: categoryId } },
      tags: tags ? {
        create: tags.map((t: string) => ({ name: t }))
      } : undefined,
      optionGroups: optionGroups ? {
        create: optionGroups.map((og: any) => ({
          name: og.name,
          minSelection: og.minSelection ?? 0,
          maxSelection: og.maxSelection ?? 1,
          isRequired: og.isRequired ?? false,
          options: {
            create: og.options.map((opt: any) => ({
              name: opt.name,
              priceModifier: new Prisma.Decimal(opt.priceModifier ?? 0),
              isAvailable: opt.isAvailable ?? true
            }))
          }
        }))
      } : undefined
    });
  }

  async updateItem(itemId: string, data: any) {
    const { tags, optionGroups, ...rest } = data;

    // For tags and options, simplified approach: delete and recreate if provided
    // In a production app, we would do more granular updates
    
    const updateData: Prisma.MenuItemUpdateInput = {
      name: rest.name,
      description: rest.description,
      price: rest.price !== undefined ? new Prisma.Decimal(rest.price) : undefined,
      imageUrl: rest.imageUrl,
      isAvailable: rest.isAvailable,
      isFeatured: rest.isFeatured,
      sortOrder: rest.sortOrder,
    };

    if (tags !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: tags.map((t: string) => ({ name: t }))
      };
    }

    // Note: optionGroups update is complex, skipping full replacement for now to keep it safe
    // If the user wants to manage options, they should have specific endpoints
    
    return this.menuRepository.updateItem(itemId, updateData);
  }

  async deleteItem(itemId: string) {
    await this.menuRepository.deleteItem(itemId);
  }

  // Ownership verification helper
  async verifyMenuOwnership(menuId: string, userId: string): Promise<boolean> {
    const menu = await this.menuRepository.findMenuWithOwnership(menuId);
    return !!menu && menu.cafe.ownerId === userId;
  }

  async verifyCategoryOwnership(categoryId: string, userId: string): Promise<boolean> {
    const category = await this.menuRepository.findCategoryWithOwnership(categoryId);
    return !!category && category.menu.cafe.ownerId === userId;
  }

  async verifyItemOwnership(itemId: string, userId: string): Promise<boolean> {
    const item = await this.menuRepository.findItemWithOwnership(itemId);
    return !!item && item.category.menu.cafe.ownerId === userId;
  }
}

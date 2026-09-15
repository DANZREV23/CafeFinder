import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export class MenuRepository {
  async findByCafeId(cafeId: string, publicOnly = true) {
    const where: Prisma.MenuWhereInput = { cafeId };
    if (publicOnly) {
      where.isActive = true;
    }

    return prisma.menu.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        categories: {
          include: {
            items: {
              include: {
                tags: true,
                optionGroups: {
                  include: {
                    options: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.menu.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            items: {
              include: {
                tags: true,
                optionGroups: {
                  include: {
                    options: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async create(data: Prisma.MenuCreateInput) {
    return prisma.menu.create({ data });
  }

  async update(id: string, data: Prisma.MenuUpdateInput) {
    return prisma.menu.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.menu.delete({
      where: { id }
    });
  }

  // Category operations
  async createCategory(data: Prisma.MenuCategoryCreateInput) {
    return prisma.menuCategory.create({ data });
  }

  async updateCategory(id: string, data: Prisma.MenuCategoryUpdateInput) {
    return prisma.menuCategory.update({
      where: { id },
      data
    });
  }

  async deleteCategory(id: string) {
    return prisma.menuCategory.delete({
      where: { id }
    });
  }

  // Item operations
  async createItem(data: Prisma.MenuItemCreateInput) {
    return prisma.menuItem.create({ data });
  }

  async updateItem(id: string, data: Prisma.MenuItemUpdateInput) {
    return prisma.menuItem.update({
      where: { id },
      data
    });
  }

  async deleteItem(id: string) {
    return prisma.menuItem.delete({
      where: { id }
    });
  }

  // Helper for ownership checks
  async findMenuWithOwnership(menuId: string) {
    return prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        cafe: {
          select: {
            id: true,
            ownerId: true
          }
        }
      }
    });
  }

  async findCategoryWithOwnership(categoryId: string) {
    return prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: {
        menu: {
          include: {
            cafe: {
              select: {
                id: true,
                ownerId: true
              }
            }
          }
        }
      }
    });
  }

  async findItemWithOwnership(itemId: string) {
    return prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          include: {
            menu: {
              include: {
                cafe: {
                  select: {
                    id: true,
                    ownerId: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
}

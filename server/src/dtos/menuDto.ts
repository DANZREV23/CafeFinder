import { Menu, MenuCategory, MenuItem, MenuItemTag, MenuItemOptionGroup, MenuItemOption } from '@prisma/client';

export interface MenuItemOptionDto {
  id: string;
  name: string;
  priceModifier: number;
  isAvailable: boolean;
}

export interface MenuItemOptionGroupDto {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
  options: MenuItemOptionDto[];
}

export interface MenuItemDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  tags: string[];
  optionGroups: MenuItemOptionGroupDto[];
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  items: MenuItemDto[];
}

export interface MenuDto {
  id: string;
  cafeId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  categories: MenuCategoryDto[];
}

export function mapToMenuDto(menu: any): MenuDto {
  return {
    id: menu.id,
    cafeId: menu.cafeId,
    name: menu.name,
    description: menu.description,
    isActive: menu.isActive,
    sortOrder: menu.sortOrder,
    categories: (menu.categories || []).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      sortOrder: cat.sortOrder || 0,
      items: (cat.items || []).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price ? parseFloat(item.price.toString()) : 0,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        sortOrder: item.sortOrder || 0,
        tags: (item.tags || []).map((t: any) => t.name),
        optionGroups: (item.optionGroups || []).map((group: any) => ({
          id: group.id,
          name: group.name,
          minSelection: group.minSelection,
          maxSelection: group.maxSelection,
          isRequired: group.isRequired,
          options: (group.options || []).map((opt: any) => ({
            id: opt.id,
            name: opt.name,
            priceModifier: opt.priceModifier ? parseFloat(opt.priceModifier.toString()) : 0,
            isAvailable: opt.isAvailable,
          })),
        })),
      })),
    })),
  };
}

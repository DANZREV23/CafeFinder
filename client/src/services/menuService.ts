import { fetchApi } from './api';

export interface MenuItemOption {
  id: string;
  name: string;
  priceModifier: number;
  isAvailable: boolean;
}

export interface MenuItemOptionGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  tags: string[];
  optionGroups: MenuItemOptionGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  cafeId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  categories: MenuCategory[];
}

export const menuService = {
  // Public
  getCafeMenu: async (slug: string): Promise<Menu[]> => {
    const response = await fetchApi<{ success: boolean, data: Menu[] }>(`/menu/${slug}`);
    return response.data;
  },

  // Owner
  getOwnerMenus: async (cafeId: string): Promise<Menu[]> => {
    const response = await fetchApi<{ success: boolean, data: Menu[] }>(`/owner/cafes/${cafeId}/menus`);
    return response.data;
  },

  createMenu: async (cafeId: string, data: any): Promise<Menu> => {
    const response = await fetchApi<{ success: boolean, data: Menu }>(`/owner/cafes/${cafeId}/menus`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  updateMenu: async (cafeId: string, menuId: string, data: any): Promise<Menu> => {
    const response = await fetchApi<{ success: boolean, data: Menu }>(`/owner/cafes/${cafeId}/menus/${menuId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  deleteMenu: async (cafeId: string, menuId: string): Promise<void> => {
    await fetchApi(`/owner/cafes/${cafeId}/menus/${menuId}`, {
      method: 'DELETE'
    });
  },

  createCategory: async (cafeId: string, menuId: string, data: any): Promise<MenuCategory> => {
    const response = await fetchApi<{ success: boolean, data: MenuCategory }>(`/owner/cafes/${cafeId}/menus/${menuId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  updateCategory: async (cafeId: string, categoryId: string, data: any): Promise<MenuCategory> => {
    const response = await fetchApi<{ success: boolean, data: MenuCategory }>(`/owner/cafes/${cafeId}/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  deleteCategory: async (cafeId: string, categoryId: string): Promise<void> => {
    await fetchApi(`/owner/cafes/${cafeId}/categories/${categoryId}`, {
      method: 'DELETE'
    });
  },

  createMenuItem: async (cafeId: string, categoryId: string, data: any): Promise<MenuItem> => {
    const response = await fetchApi<{ success: boolean, data: MenuItem }>(`/owner/cafes/${cafeId}/categories/${categoryId}/items`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  updateMenuItem: async (cafeId: string, itemId: string, data: any): Promise<MenuItem> => {
    const response = await fetchApi<{ success: boolean, data: MenuItem }>(`/owner/cafes/${cafeId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  deleteMenuItem: async (cafeId: string, itemId: string): Promise<void> => {
    await fetchApi(`/owner/cafes/${cafeId}/items/${itemId}`, {
      method: 'DELETE'
    });
  }
};

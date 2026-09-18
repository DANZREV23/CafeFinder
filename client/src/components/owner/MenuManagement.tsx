import React, { useState, useEffect } from 'react';
import { Menu, menuService } from '@/services/menuService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { 
  Plus, 
  Trash2, 
  X, 
  Utensils
} from 'lucide-react';

interface MenuManagementProps {
  cafeId: string;
}

export default function MenuManagement({ cafeId }: MenuManagementProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // Forms
  const [menuForm, setMenuForm] = useState({ name: '', description: '', isActive: true });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: 0, tags: [] as string[] });

  useEffect(() => {
    loadMenus();
  }, [cafeId]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const data = await menuService.getOwnerMenus(cafeId);
      setMenus(data);
    } catch (err) {
      console.error('Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenu = async () => {
    try {
      await menuService.createMenu(cafeId, menuForm);
      setMenuForm({ name: '', description: '', isActive: true });
      setShowAddMenu(false);
      loadMenus();
    } catch (err) {
      alert('Failed to create menu');
    }
  };

  const handleAddCategory = async (menuId: string) => {
    try {
      await menuService.createCategory(cafeId, menuId, categoryForm);
      setCategoryForm({ name: '', description: '' });
      loadMenus();
    } catch (err) {
      alert('Failed to add category');
    }
  };

  const handleAddItem = async (categoryId: string) => {
    try {
      await menuService.createMenuItem(cafeId, categoryId, itemForm);
      setItemForm({ name: '', description: '', price: 0, tags: [] });
      loadMenus();
    } catch (err) {
      alert('Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await menuService.deleteMenuItem(cafeId, itemId);
      loadMenus();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category and all its items?')) return;
    try {
      await menuService.deleteCategory(cafeId, categoryId);
      loadMenus();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  if (loading) return <div className="p-8 text-center text-brand-muted">Loading menu system...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-brand-charcoal">Menu Management</h2>
        <Button onClick={() => setShowAddMenu(!showAddMenu)} variant={showAddMenu ? "outline" : "primary"}>
          {showAddMenu ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showAddMenu ? "Cancel" : "Add New Menu"}
        </Button>
      </div>

      {showAddMenu && (
        <Card className="rounded-3xl border-brand-border">
          <CardHeader>
            <CardTitle className="font-serif">New Menu</CardTitle>
            <CardDescription>Create a separate menu (e.g., Breakfast, Lunch, Drinks)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-muted uppercase tracking-wider">Menu Name</label>
              <input 
                placeholder="e.g. Main Menu" 
                className="w-full rounded-xl border border-brand-border p-3"
                value={menuForm.name} 
                onChange={e => setMenuForm({...menuForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-muted uppercase tracking-wider">Description (Optional)</label>
              <textarea 
                placeholder="Brief description of this menu" 
                className="w-full rounded-xl border border-brand-border p-3"
                rows={3}
                value={menuForm.description}
                onChange={e => setMenuForm({...menuForm, description: e.target.value})}
              />
            </div>
            <Button onClick={handleAddMenu} disabled={!menuForm.name} variant="primary">Create Menu</Button>
          </CardContent>
        </Card>
      )}

      {menus.length === 0 && !showAddMenu && (
        <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-[32px] bg-brand-cream/5">
          <Utensils className="h-12 w-12 mx-auto mb-4 text-brand-coffee/20" />
          <p className="text-brand-muted font-medium">You haven't created any menus yet.</p>
        </div>
      )}

      <div className="space-y-12">
        {menus.map(menu => (
          <div key={menu.id} className="space-y-6">
            <div className="flex justify-between items-start border-b border-brand-border pb-4">
              <div>
                <h3 className="text-3xl font-serif font-bold text-brand-charcoal">{menu.name}</h3>
                {menu.description && <p className="text-brand-muted mt-1">{menu.description}</p>}
              </div>
              <Button variant="outline" size="sm" className="text-red-600 border-red-100 hover:bg-red-50" onClick={() => menuService.deleteMenu(cafeId, menu.id).then(loadMenus)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Menu
              </Button>
            </div>

            {/* Categories */}
            <div className="space-y-8">
              {menu.categories.map(category => (
                <div key={category.id} className="bg-white rounded-[32px] p-8 border border-brand-border shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold text-brand-charcoal">{category.name}</h4>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category.id)} className="text-red-600 border-red-100">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.items.map(item => (
                      <div key={item.id} className="bg-brand-background p-4 rounded-2xl border border-brand-border flex justify-between group hover:border-brand-coffee/30 transition-all">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-charcoal">{item.name}</span>
                            <span className="text-sm text-brand-coffee font-bold">₱{item.price.toFixed(2)}</span>
                          </div>
                          {item.description && <p className="text-xs text-brand-muted mt-1 line-clamp-1">{item.description}</p>}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}

                    {/* Quick Add Item */}
                    <div className="border border-dashed border-brand-coffee/20 rounded-2xl p-4 flex flex-col gap-3 bg-brand-cream/5">
                      <input 
                        placeholder="Item name" 
                        className="w-full rounded-xl border border-brand-border p-2 text-sm"
                        value={itemForm.name}
                        onChange={e => setItemForm({...itemForm, name: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Price" 
                          className="w-24 rounded-xl border border-brand-border p-2 text-sm"
                          value={itemForm.price || ''}
                          onChange={e => setItemForm({...itemForm, price: parseFloat(e.target.value) || 0})}
                        />
                        <Button size="sm" className="flex-1 rounded-xl" variant="primary" onClick={() => handleAddItem(category.id)}>Add Item</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Category */}
              <div className="flex items-center gap-4 p-6 border-2 border-dashed border-brand-border rounded-[32px] bg-white">
                <input 
                  placeholder="New category (e.g. Espresso Drinks)" 
                  className="flex-1 rounded-xl border border-brand-border p-3"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                />
                <Button variant="outline" onClick={() => handleAddCategory(menu.id)} className="rounded-xl h-12">Add Category</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

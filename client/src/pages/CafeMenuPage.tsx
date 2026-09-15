import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { menuService, Menu, MenuCategory, MenuItem } from '@/services/menuService';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Info, Search, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CafeMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (slug) {
      loadMenu();
    }
  }, [slug]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await menuService.getCafeMenu(slug!);
      setMenus(data);
      if (data.length > 0) {
        setActiveMenuId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const activeMenu = menus.find(m => m.id === activeMenuId);

  const filteredCategories = activeMenu?.categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(cat => cat.items.length > 0) || [];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !menus.length) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">{error || 'No menu available for this cafe'}</h2>
          <Button asChild>
            <Link to={`/cafes/${slug}`}>Back to Cafe Profile</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={`/cafes/${slug}`} className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Cafe Profile
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Cafe Menu</h1>
              <p className="text-muted-foreground">Explore our delicious offerings</p>
            </div>
            
            {menus.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {menus.map(menu => (
                  <button
                    key={menu.id}
                    onClick={() => setActiveMenuId(menu.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeMenuId === menu.id 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for items, ingredients, or dietary tags..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-12">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <section key={category.id} className="scroll-mt-20">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-1">{category.name}</h2>
                  {category.description && (
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  )}
                  <div className="h-1 w-12 bg-primary rounded-full mt-2"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No items found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

const MenuItemCard: React.FC<{ item: MenuItem }> = ({ item }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group"
    >
      <div className="flex h-full">
        <div className="flex-1 p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{item.name}</h3>
            <span className="font-semibold text-lg">${item.price.toFixed(2)}</span>
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">
            {item.description}
          </p>

          <div className="flex flex-wrap gap-2 mt-auto">
            {item.tags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {tag}
              </span>
            ))}
            {item.isFeatured && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                ⭐ Featured
              </span>
            )}
          </div>

          {item.optionGroups.length > 0 && (
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="mt-4 text-xs font-medium text-primary flex items-center hover:underline"
            >
              <Info className="h-3 w-3 mr-1" />
              {showDetails ? 'Hide variations' : 'View variations'}
            </button>
          )}

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  {item.optionGroups.map(group => (
                    <div key={group.id} className="text-xs">
                      <p className="font-bold mb-2 uppercase text-muted-foreground tracking-tight">{group.name}</p>
                      <div className="space-y-1">
                        {group.options.map(opt => (
                          <div key={opt.id} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                            <span className={opt.isAvailable ? '' : 'text-muted-foreground line-through'}>{opt.name}</span>
                            {opt.priceModifier > 0 && (
                              <span className="text-muted-foreground">+$ {opt.priceModifier.toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {item.imageUrl && (
          <div className="w-32 sm:w-40 relative hidden sm:block">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

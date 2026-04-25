import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Leaf, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/formatters';
import { formatProductUnit } from '@/lib/unitHelpers';

type Product = {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  weight: string | null;
  unit: string | null;
  unit_type: string | null;
  quantity_count: number | null;
  stock_quantity: number;
  average_rating: number | null;
  category_id: string | null;
  is_featured: boolean | null;
  is_combo: boolean | null;
  combo_badge: string | null;
  categories?: { name: string } | null;
};

type Category = { id: string; name: string; sort_order: number };

type BestsellersSettings = {
  enabled: boolean;
  label: string;
  sort_order: number;
};

const BESTSELLERS_TAB = '__bestsellers__';
const ALL_TAB = '__all__';

const DEFAULT_BESTSELLERS: BestsellersSettings = {
  enabled: true,
  label: 'Bestsellers',
  sort_order: -1,
};

export default function ShopByCategory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, addToCart } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<BestsellersSettings>(DEFAULT_BESTSELLERS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(BESTSELLERS_TAB);
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const [catsRes, prodsRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('id, name, sort_order').order('sort_order'),
        supabase
          .from('products')
          .select('id, name, price, compare_price, image_url, weight, unit, unit_type, quantity_count, stock_quantity, average_rating, category_id, is_featured, is_combo, combo_badge, categories(name)')
          .eq('is_available', true)
          .order('created_at', { ascending: false })
          .limit(40),
        supabase
          .from('public_store_settings')
          .select('bestsellers_enabled, bestsellers_label, bestsellers_sort_order')
          .maybeSingle(),
      ]);
      if (catsRes.data) setCategories(catsRes.data as Category[]);
      if (prodsRes.data) setProducts(prodsRes.data as unknown as Product[]);
      if (settingsRes.data) {
        setBestsellers({
          enabled: settingsRes.data.bestsellers_enabled ?? true,
          label: settingsRes.data.bestsellers_label || 'Bestsellers',
          sort_order: settingsRes.data.bestsellers_sort_order ?? -1,
        });
      }
    } catch (e) {
      console.error('ShopByCategory load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => load(), { timeout: 400 });
    } else {
      setTimeout(load, 200);
    }
  }, []);

  // Live updates: refresh when admin changes categories, products, or store settings
  useEffect(() => {
    const channel = supabase
      .channel('shop-by-category-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const visibleCategories = useMemo(() => {
    const ids = new Set(products.map(p => p.category_id).filter(Boolean));
    return categories.filter(c => ids.has(c.id));
  }, [categories, products]);

  // Build the ordered tab list, inserting Bestsellers at admin-defined sort_order
  const orderedTabs = useMemo(() => {
    type Tab = { key: string; label: string; sort: number };
    const tabs: Tab[] = [
      { key: ALL_TAB, label: 'All Products', sort: -9999 },
      ...visibleCategories.map(c => ({ key: c.id, label: c.name, sort: c.sort_order })),
    ];
    if (bestsellers.enabled) {
      tabs.push({ key: BESTSELLERS_TAB, label: bestsellers.label, sort: bestsellers.sort_order });
    }
    return tabs.sort((a, b) => a.sort - b.sort);
  }, [visibleCategories, bestsellers]);

  // Ensure activeTab is always valid; default to first tab
  useEffect(() => {
    if (loading || orderedTabs.length === 0) return;
    if (!orderedTabs.some(t => t.key === activeTab)) {
      setActiveTab(orderedTabs[0].key);
    }
  }, [orderedTabs, activeTab, loading]);

  const filtered = useMemo(() => {
    if (activeTab === BESTSELLERS_TAB) return products.filter(p => p.is_featured).slice(0, 8);
    if (activeTab === ALL_TAB) return products.slice(0, 8);
    return products.filter(p => p.category_id === activeTab).slice(0, 8);
  }, [products, activeTab]);

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    let isSuccess = false; // Track success to preserve existing delay UX on success only.
    setAddingItems(prev => new Set(prev).add(productId)); // Mark in-flight immediately.
    try {
      await addToCart(productId, 1); // Await rejection-capable addToCart contract.
      isSuccess = true; // Flag success for delayed clear behavior.
    } catch {
      // Swallow here; cart hook already surfaces toast for failure.
    } finally {
      if (isSuccess) {
        setTimeout(() => {
          setAddingItems(prev => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }, 600); // Keep existing short success feedback window.
      } else {
        setAddingItems(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        }); // Unconditional immediate cleanup on failure.
      }
    }
  };

  if (!loading && products.length === 0) return null;

  const tabBaseClass = 'px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap';
  const tabActiveClass = 'bg-primary text-primary-foreground border-primary shadow-sm';
  const tabIdleClass = 'bg-background text-foreground border-border hover:bg-secondary hover:border-primary/40';

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Our Products</h2>
            <div className="mt-2 h-1 w-16 bg-primary/80 rounded-full" />
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/products">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {/* Category tabs */}
        <div className="mb-6 md:mb-8 -mx-4 px-4 py-1 overflow-x-auto overflow-y-visible scrollbar-hide">
          <div className="flex gap-2 md:gap-3 min-w-max md:flex-wrap md:min-w-0">
            {loading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-9 w-24 rounded-full" />
                ))
              : orderedTabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`${tabBaseClass} ${activeTab === t.key ? tabActiveClass : tabIdleClass}`}
                  >
                    {t.label}
                  </button>
                ))}
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 md:h-56 lg:h-64 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {activeTab === BESTSELLERS_TAB
              ? 'No bestsellers featured yet.'
              : 'No products found in this category.'}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"
            >
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="h-full"
                >
                  <Link to={`/products/${p.id}`} className="h-full block">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col border-0 shadow-sm">
                      <div className="h-40 md:h-56 lg:h-64 w-full bg-muted flex items-center justify-center overflow-hidden relative">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover object-center rounded-lg group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <Leaf className="h-12 w-12 text-muted-foreground/30" />
                        )}
                        {p.is_combo && (
                          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-500 text-white text-[10px] md:text-xs border-0 shadow-md font-bold tracking-wide uppercase">
                            {p.combo_badge?.trim() || 'Combo Deal'}
                          </Badge>
                        )}
                        {!p.is_combo && p.compare_price && Number(p.compare_price) > Number(p.price) && (
                          <Badge className="absolute top-2 left-2 bg-accent hover:bg-accent text-accent-foreground text-[10px] md:text-xs border-0 shadow-sm">
                            {Math.round(((Number(p.compare_price) - Number(p.price)) / Number(p.compare_price)) * 100)}% OFF
                          </Badge>
                        )}
                        {p.stock_quantity <= 5 && p.stock_quantity > 0 && (
                          <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] md:text-xs border-0 shadow-sm">Few Left</Badge>
                        )}
                        {p.stock_quantity === 0 && (
                          <Badge variant="destructive" className="absolute top-2 right-2 text-[10px] md:text-xs border-0 shadow-sm">Out of Stock</Badge>
                        )}
                      </div>
                      <CardContent className="p-3 md:p-4 flex-1 flex flex-col">
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">{p.categories?.name}</p>
                          <h3 className="font-semibold text-sm md:text-base font-sans line-clamp-2 mb-1 leading-tight group-hover:text-primary transition-colors">{p.name}</h3>
                          {(() => {
                            const unitLabel = formatProductUnit(p) || (p.weight ? `${p.weight}${p.unit ? ` ${p.unit}` : ''}` : '');
                            return unitLabel ? <p className="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">{unitLabel}</p> : null;
                          })()}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 md:mb-3">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="font-medium text-base md:text-lg text-primary">{formatPrice(p.price)}</span>
                            {p.compare_price && <span className="text-xs md:text-sm text-muted-foreground line-through">{formatPrice(p.compare_price)}</span>}
                          </div>
                          {p.average_rating !== null && p.average_rating !== undefined && Number(p.average_rating) > 0 && (
                            <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
                              <span className="text-yellow-500">★</span>
                              {Number(p.average_rating).toFixed(1)}+
                            </span>
                          )}
                        </div>
                        <div className="mt-auto pt-3 flex justify-center">
                          {((cartItems || []).some(i => i.product_id === p.id) || addingItems.has(p.id)) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full rounded-full text-sm bg-primary text-primary-foreground group-hover:!bg-transparent group-hover:!text-foreground transition-all"
                              onClick={(e) => { e.preventDefault(); navigate('/cart'); }}
                            >
                              <motion.span initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center justify-center">
                                <ShoppingCart className="h-4 w-4 mr-2" /> Added to Cart
                              </motion.span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full rounded-full text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                              variant={addingItems.has(p.id) ? 'secondary' : 'outline'}
                              onClick={(e) => {
                                e.preventDefault();
                                handleAddToCart(p.id);
                              }}
                              disabled={p.stock_quantity === 0 || addingItems.has(p.id)}
                            >
                              {addingItems.has(p.id) ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, ease: 'easeInOut' }}>✓</motion.div>
                                  Added
                                </motion.div>
                              ) : p.stock_quantity === 0 ? (
                                'Out of Stock'
                              ) : (
                                <>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Buy Now
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

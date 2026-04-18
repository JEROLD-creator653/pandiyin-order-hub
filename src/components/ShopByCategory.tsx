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

type Product = {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  weight: string | null;
  unit: string | null;
  stock_quantity: number;
  average_rating: number | null;
  category_id: string | null;
  is_featured: boolean | null;
  categories?: { name: string } | null;
};

type Category = { id: string; name: string };

const BESTSELLERS_TAB = '__bestsellers__';
const ALL_TAB = '__all__';

export default function ShopByCategory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, addToCart } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(BESTSELLERS_TAB);
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [catsRes, prodsRes] = await Promise.all([
          supabase.from('categories').select('id, name').order('sort_order'),
          supabase
            .from('products')
            .select('id, name, price, compare_price, image_url, weight, unit, stock_quantity, average_rating, category_id, is_featured, categories(name)')
            .eq('is_available', true)
            .order('created_at', { ascending: false })
            .limit(40),
        ]);
        if (catsRes.data) setCategories(catsRes.data as Category[]);
        if (prodsRes.data) setProducts(prodsRes.data as unknown as Product[]);
      } catch (e) {
        console.error('ShopByCategory load failed:', e);
      } finally {
        setLoading(false);
      }
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => load(), { timeout: 400 });
    } else {
      setTimeout(load, 200);
    }
  }, []);

  const visibleCategories = useMemo(() => {
    // Only show categories that actually have products
    const ids = new Set(products.map(p => p.category_id).filter(Boolean));
    return categories.filter(c => ids.has(c.id));
  }, [categories, products]);

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
    setAddingItems(prev => new Set(prev).add(productId));
    await addToCart(productId, 1);
    setTimeout(() => {
      setAddingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }, 600);
  };

  if (!loading && products.length === 0) return null;

  const tabBaseClass = 'px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap';
  const tabActiveClass = 'bg-primary text-primary-foreground border-primary shadow-sm';
  const tabIdleClass = 'bg-background text-foreground border-border hover:bg-secondary hover:border-primary/40';

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        {/* Section header — matches site style */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Our Products</h2>
            <div className="mt-2 h-1 w-16 bg-primary/80 rounded-full" />
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/products">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {/* Category tabs — horizontally scrollable on mobile */}
        <div className="mb-6 md:mb-8 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 md:gap-3 min-w-max md:flex-wrap md:min-w-0">
            <button
              onClick={() => setActiveTab(BESTSELLERS_TAB)}
              className={`${tabBaseClass} ${activeTab === BESTSELLERS_TAB ? tabActiveClass : tabIdleClass}`}
            >
              Bestsellers
            </button>
            <button
              onClick={() => setActiveTab(ALL_TAB)}
              className={`${tabBaseClass} ${activeTab === ALL_TAB ? tabActiveClass : tabIdleClass}`}
            >
              All Products
            </button>
            {(loading ? Array.from({ length: 4 }) : visibleCategories).map((c: any, idx) =>
              loading ? (
                <Skeleton key={idx} className="h-9 w-24 rounded-full" />
              ) : (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={`${tabBaseClass} ${activeTab === c.id ? tabActiveClass : tabIdleClass}`}
                >
                  {c.name}
                </button>
              )
            )}
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
                        {p.compare_price && Number(p.compare_price) > Number(p.price) && (
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
                          {p.weight && <p className="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">{p.weight}{p.unit ? ` ${p.unit}` : ''}</p>}
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
                                <ShoppingCart className="h-4 w-4 mr-2" /> Go to Cart
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
                                  Add to Cart
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

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/formatters';
import { SkeletonCard } from '@/components/ui/loader';

interface RelatedProductsProps {
  currentProductId: string;
  categoryId?: string;
  maxItems?: number;
}

export default function RelatedProducts({
  currentProductId,
  categoryId,
  maxItems = 4
}: RelatedProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true);

      try {
        let query = supabase
          .from('products')
          .select('*, categories(name)')
          .neq('id', currentProductId) // Exclude current product
          .eq('is_available', true)
          .gt('stock_quantity', 0)
          .limit(maxItems);

        // Priority 1: Same category
        if (categoryId) {
          const { data: categoryProducts, error: categoryError } = await query
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false });

          if (!categoryError && categoryProducts && categoryProducts.length >= 1) {
            setProducts(categoryProducts);
            setLoading(false);
            return;
          }
        }

        // Priority 2: Random featured products (if category matching fails)
        const { data: randomProducts, error: randomError } = await query
          .order('created_at', { ascending: false });

        if (!randomError && randomProducts) {
          setProducts(randomProducts);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId) {
      fetchRelatedProducts();
    }
  }, [currentProductId, categoryId, maxItems]);

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

  // Don't show section only when no products found
  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="w-full pt-4 pb-2 sm:py-8 mt-6 sm:mt-12 mb-0 sm:mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-display font-bold text-foreground">
            You may also like
          </h2>
        </div>
      </div>

      {loading ? (
        <SkeletonCard count={4} className="gap-4" />
      ) : (
        <>
          {/* Desktop Grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="h-full"
              >
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                  <Link to={`/products/${product.id}`} className="block">
                    <div className="relative aspect-square w-full bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}

                      {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2 text-xs bg-white/90 backdrop-blur-sm"
                        >
                          Only {product.stock_quantity} left
                        </Badge>
                      )}
                    </div>
                  </Link>

                  <CardContent className="p-4 flex-1 flex flex-col">
                    <Link to={`/products/${product.id}`}>
                      {product.categories?.name && (
                        <Badge variant="outline" className="mb-2 text-xs">
                          {product.categories.name}
                        </Badge>
                      )}

                      <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      {product.weight && <p className="text-xs text-muted-foreground mb-1">{product.weight}{product.unit ? ` ${product.unit}` : ''}</p>}
                    </Link>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-medium text-primary">
                          {formatPrice(product.price)}
                        </p>
                        {product.average_rating !== null && product.average_rating !== undefined && Number(product.average_rating) > 0 && (
                          <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
                            <span className="text-yellow-500">★</span>
                            {Number(product.average_rating).toFixed(1)}+
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="w-full rounded-full text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                        variant={addingItems.has(product.id) ? "secondary" : "outline"}
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product.id);
                        }}
                        disabled={product.stock_quantity === 0 || addingItems.has(product.id)}
                      >
                        {addingItems.has(product.id) ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                            >
                              ✓
                            </motion.div>
                            Added
                          </motion.div>
                        ) : product.stock_quantity === 0 ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Mobile Horizontal Slider */}
          <div className="sm:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex gap-3 pb-2">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 snap-start w-full"
                >
                      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <Link to={`/products/${product.id}`} className="block">
                        <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Leaf className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}

                        {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                          <Badge
                            variant="secondary"
                            className="absolute top-1 right-1 text-[10px] bg-white/90"
                          >
                            {product.stock_quantity} left
                          </Badge>
                        )}
                      </div>
                    </Link>

                    <CardContent className="p-2.5 flex-1 flex flex-col">
                      <Link to={`/products/${product.id}`}>
                        {product.categories?.name && (
                          <Badge variant="outline" className="mb-1 text-[10px] px-2 py-0.5">
                            {product.categories.name}
                          </Badge>
                        )}

                        <h3 className="font-semibold text-[13px] leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="mt-auto space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[15px] font-medium text-primary">
                            {formatPrice(product.price)}
                          </p>
                          {product.average_rating !== null && product.average_rating !== undefined && Number(product.average_rating) > 0 && (
                            <span className="flex items-center gap-0.5 text-xs font-medium"><span className="text-yellow-500">★</span>{Number(product.average_rating).toFixed(1)}</span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className="w-full rounded-full text-xs h-8"
                          variant={addingItems.has(product.id) ? "secondary" : "outline"}
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product.id);
                          }}
                          disabled={product.stock_quantity === 0 || addingItems.has(product.id)}
                        >
                          {addingItems.has(product.id) ? '✓ Added' : 'Add'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

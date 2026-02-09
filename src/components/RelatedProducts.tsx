import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/formatters';

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

          if (!categoryError && categoryProducts && categoryProducts.length >= 2) {
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

  // Don't show section if no products or still loading with no products
  if (!loading && (!products || products.length < 2)) {
    return null;
  }

  return (
    <section className="w-full py-8 mt-12 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-display font-bold text-foreground">
            You may also like
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {/* Stock badge */}
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
                    {/* Category tag */}
                    {product.categories?.name && (
                      <Badge variant="outline" className="mb-2 text-xs">
                        {product.categories.name}
                      </Badge>
                    )}
                    
                    <h3 className="font-semibold text-sm line-clamp-2 mb-3 group-hover:text-primary transition-colors min-h-[2.5rem]">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-auto space-y-3">
                    <p className="text-lg font-medium text-primary">
                      {formatPrice(product.price)}
                    </p>

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
      )}
    </section>
  );
}

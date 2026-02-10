import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { formatPrice } from '@/lib/formatters';

interface ProductRecommendationsProps {
  cartItems: any[];
  maxItems?: number;
  title?: string;
}

export default function ProductRecommendations({ 
  cartItems, 
  maxItems = 6,
  title = "You may also like"
}: ProductRecommendationsProps) {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useProductRecommendations(cartItems, maxItems);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

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

  // Don't show section if no recommendations
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 mt-8 border-t">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-display font-bold text-foreground">
          {title}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(maxItems)].map((_, i) => (
            <Card key={i} className="overflow-hidden h-full flex flex-col">
              <div className="h-52 md:h-56 lg:h-64 bg-muted animate-pulse w-full" />
              <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="mt-auto h-8 bg-muted rounded w-full animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {recommendations.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="h-full"
            >
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col border-0 shadow-sm">
                <Link to={`/products/${product.id}`} className="block">
                  <div className="relative h-52 md:h-56 lg:h-64 w-full bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
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
                        className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-white/90 backdrop-blur-sm shadow-sm"
                      >
                        Only {product.stock_quantity} left
                      </Badge>
                    )}
                  </div>
                </Link>

                <CardContent className="p-3 flex-1 flex flex-col">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug" title={product.name}>
                      {product.name}
                    </h3>
                    {product.weight && <p className="text-xs text-muted-foreground mb-1">{product.weight}{product.unit ? ` ${product.unit}` : ''}</p>}
                  </Link>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-medium text-primary">
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
                      className="w-full rounded-full text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                      variant={addingItems.has(product.id) ? "secondary" : "outline"}
                      onClick={() => handleAddToCart(product.id)}
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
                          <ShoppingCart className="h-3 w-3 mr-1" />
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

      {/* Alternative titles section for future reference */}
      {/* "Frequently bought together" | "Add these to your order" | "Complete your order" */}
    </section>
  );
}

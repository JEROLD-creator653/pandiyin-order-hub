import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';

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
  const { data: recommendations, isLoading } = useProductRecommendations(cartItems, maxItems);
  const { addToCart } = useCart();
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

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
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <CardContent className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
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
            >
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <Link to={`/products/${product.id}`} className="block">
                  <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
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

                <CardContent className="p-3 flex-1 flex flex-col">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-auto space-y-2">
                    <p className="text-lg font-bold text-primary">
                      ₹{product.price}
                    </p>

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

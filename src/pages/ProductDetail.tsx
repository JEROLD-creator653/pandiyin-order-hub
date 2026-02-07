import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!id) return;
    supabase.from('products').select('*, categories(name)').eq('id', id).maybeSingle().then(({ data }) => {
      setProduct(data);
      setLoading(false);
    });
  }, [id]);

  const handleAddToCart = () => {
    if (!user) { navigate('/auth'); return; }
    addToCart(product.id, qty);
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>Back to Products</Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Leaf className="h-20 w-20 text-muted-foreground/30" />
          )}
        </div>
        <div>
          {product.categories?.name && (
            <Badge variant="secondary" className="mb-3">{product.categories.name}</Badge>
          )}
          <h1 className="text-3xl font-display font-bold mb-4">{product.name}</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">₹{product.price}</span>
            {product.compare_price && (
              <span className="text-lg text-muted-foreground line-through">₹{product.compare_price}</span>
            )}
          </div>
          {product.weight && <p className="text-sm text-muted-foreground mb-4">{product.weight} {product.unit}</p>}
          <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

          {product.stock_quantity > 0 ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
                  <span className="w-12 text-center font-medium">{qty}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}><Plus className="h-4 w-4" /></Button>
                </div>
                <span className="text-sm text-muted-foreground">{product.stock_quantity} in stock</span>
              </div>
              <div className="flex gap-3">
                <Button size="lg" className="flex-1 rounded-full" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                <Button size="lg" variant="secondary" className="rounded-full" onClick={() => {
                  handleAddToCart();
                  navigate('/cart');
                }}>
                  Buy Now
                </Button>
              </div>
            </>
          ) : (
            <Badge variant="destructive" className="text-base px-4 py-2">Out of Stock</Badge>
          )}
        </div>
      </motion.div>
    </div>
  );
}

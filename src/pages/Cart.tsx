import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import ProductRecommendations from '@/components/ProductRecommendations';

export default function Cart() {
  const { items, total, loading, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Sign in to view your cart</h2>
        <Button onClick={() => navigate('/auth')} className="mt-4">Sign In</Button>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some delicious products to get started!</p>
          <Button asChild><Link to="/products">Browse Products</Link></Button>
        </div>
        
        {/* Show featured recommendations even when cart is empty */}
        <ProductRecommendations 
          cartItems={[]} 
          maxItems={6}
          title="Featured Products"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <h1 className="text-3xl font-display font-bold mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Leaf className="h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product_id}`} className="font-semibold text-sm hover:text-primary line-clamp-1">{item.product.name}</Link>
                  <p className="text-primary font-bold mt-1">₹{item.product.price}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border rounded-md">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="text-right font-bold whitespace-nowrap">₹{(item.product.price * item.quantity).toFixed(2)}</div>
              </Card>
            </motion.div>
          ))}
        </div>
        <div>
          <Card className="p-6 sticky top-20">
            <h3 className="font-display font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-primary">Calculated at checkout</span></div>
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
            <Button className="w-full mt-6 rounded-full" size="lg" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>

      {/* Intelligent Product Recommendations */}
      <ProductRecommendations 
        cartItems={items} 
        maxItems={6}
        title="You may also like"
      />
    </div>
  );
}

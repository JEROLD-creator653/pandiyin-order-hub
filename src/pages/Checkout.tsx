import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import AddressManager from '@/components/AddressManager';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (items.length === 0) { navigate('/cart'); return; }
    supabase.from('delivery_settings').select('*').eq('is_active', true).maybeSingle().then(({ data }) => {
      if (data) {
        setDeliveryCharge(total >= (data.free_delivery_above || 0) ? 0 : Number(data.base_charge));
      }
    });
  }, [user, items.length]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.trim().toUpperCase()).eq('is_active', true).maybeSingle();
    if (!data) { toast({ title: 'Invalid coupon', variant: 'destructive' }); return; }
    if (data.min_order_value && total < Number(data.min_order_value)) {
      toast({ title: `Minimum order ₹${data.min_order_value}`, variant: 'destructive' }); return;
    }
    const disc = data.discount_type === 'percentage' ? (total * Number(data.discount_value)) / 100 : Number(data.discount_value);
    setDiscount(disc);
    toast({ title: `Coupon applied! You save ₹${disc.toFixed(2)}` });
  };

  const placeOrder = async () => {
    if (!selectedAddress || !selectedAddress.full_name || !selectedAddress.phone || !selectedAddress.address_line1 || !selectedAddress.pincode) {
      toast({ title: 'Please select or add a delivery address', variant: 'destructive' }); return;
    }
    setLoading(true);
    try {
      const grandTotal = total - discount + deliveryCharge;
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user!.id,
        order_number: 'temp',
        subtotal: total,
        delivery_charge: deliveryCharge,
        discount,
        total: grandTotal,
        coupon_code: couponCode || null,
        payment_method: paymentMethod as any,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        delivery_address: selectedAddress,
      }).select().single();
      if (error) throw error;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);
      clearCart();
      toast({ title: 'Order placed successfully!' });
      navigate(`/order-confirmation/${order.id}`);
    } catch (err: any) {
      toast({ title: 'Order failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = total - discount + deliveryCharge;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Delivery Address</CardTitle></CardHeader>
            <CardContent>
              <AddressManager
                selectable
                selectedId={selectedAddressId}
                onSelect={(addr) => {
                  setSelectedAddress(addr);
                  setSelectedAddressId(addr.id || null);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Payment Method</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer"><Banknote className="h-5 w-5" /> Cash on Delivery</Label>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                  <RadioGroupItem value="stripe" id="stripe" disabled />
                  <Label htmlFor="stripe" className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pay Online (Coming Soon)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Order Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="Any special instructions..." />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="p-6 sticky top-20">
            <h3 className="font-display font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground truncate max-w-[60%]">{item.product.name} ×{item.quantity}</span>
                  <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge.toFixed(2)}`}</span></div>
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Selected address in summary */}
            {selectedAddress && selectedAddress.full_name && (
              <div className="border-t mt-3 pt-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Deliver to</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedAddress.full_name}, {selectedAddress.address_line1}
                  {selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}, {selectedAddress.city} - {selectedAddress.pincode}
                </p>
                <p className="text-xs text-muted-foreground">{selectedAddress.phone}</p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Input placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="flex-1" />
              <Button variant="outline" onClick={applyCoupon} size="sm">Apply</Button>
            </div>

            <Button className="w-full mt-6 rounded-full" size="lg" onClick={placeOrder} disabled={loading}>
              {loading ? 'Placing Order...' : `Place Order · ₹${grandTotal.toFixed(2)}`}
            </Button>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

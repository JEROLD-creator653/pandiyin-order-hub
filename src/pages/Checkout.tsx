import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, MapPin, ShieldCheck, Truck, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useShippingRegions } from '@/hooks/useShippingRegions';
import AddressManager, { Address } from '@/components/AddressManager';
import TaxInclusiveInfo from '@/components/TaxInclusiveInfo';
import { ButtonLoader, Loader } from '@/components/loaders';
import { formatPrice } from '@/lib/formatters';
import { getPricingInfo } from '@/lib/discountCalculations';

// Helper function to get GST type based on state
const getGSTType = (state: string): 'cgst_sgst' | 'igst' => {
  const sameSateStates = ['Tamil Nadu', 'Puducherry'];
  return sameSateStates.includes(state) ? 'cgst_sgst' : 'igst';
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, total, clearCart } = useCart();
  const { regions, getDeliveryCharge } = useShippingRegions();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [gstSettings, setGstSettings] = useState({ gst_enabled: false });
  const [productGstMap, setProductGstMap] = useState<Map<string, any>>(new Map());
  const [calculatedGstAmount, setCalculatedGstAmount] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);
  const [newOrderId, setNewOrderId] = useState("");

  useEffect(() => {
    // Wait for auth loading to complete before redirecting
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    // Check cart only after user is confirmed
    if (user && items.length === 0) {
      navigate('/cart');
      return;
    }
    supabase.from('store_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        setGstSettings({
          gst_enabled: (data as any).gst_enabled || false,
        });
      }
    });
  }, [user, items.length, authLoading]);

  // Fetch product GST details and calculate total GST
  useEffect(() => {
    if (items.length === 0) return;

    const fetchProductGst = async () => {
      const productIds = items.map(item => item.product_id);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, gst_percentage, hsn_code, tax_inclusive')
        .in('id', productIds);

      const gstMap = new Map(productsData?.map(p => [p.id, p]) || []);
      setProductGstMap(gstMap);

      // Calculate total GST from all products
      let totalGst = 0;
      items.forEach(item => {
        const productGst = gstMap.get(item.product_id) || {};
        const itemGstPercentage = (productGst as any)?.gst_percentage || 5;
        const itemBasePrice = (productGst as any)?.tax_inclusive ?
          item.product.price * 100 / (100 + itemGstPercentage) :
          item.product.price;
        const itemGstAmount = (itemBasePrice * itemGstPercentage / 100) * item.quantity;
        totalGst += itemGstAmount;
      });

      setCalculatedGstAmount(totalGst);
    };

    fetchProductGst();
  }, [items]);

  // Recalculate delivery when address changes
  useEffect(() => {
    if (selectedAddress?.state && regions.length > 0) {
      const charge = getDeliveryCharge(selectedAddress.state, total);
      setDeliveryCharge(charge);
    } else {
      setDeliveryCharge(0);
    }
  }, [selectedAddress, regions, total, getDeliveryCharge]);

  // Handle redirect after order placed
  useEffect(() => {
    if (orderPlaced && newOrderId) {
      setTimeout(() => {
        navigate(`/order-confirmation/${newOrderId}`);
      }, 2200);
    }
  }, [orderPlaced, newOrderId, navigate]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.trim().toUpperCase()).eq('is_active', true).maybeSingle();
    if (!data) { toast({ title: 'Invalid coupon', variant: 'destructive' }); return; }
    if (data.min_order_value && total < Number(data.min_order_value)) {
      toast({ title: `Minimum order ${formatPrice(data.min_order_value)}`, variant: 'destructive' }); return;
    }
    const disc = data.discount_type === 'percentage' ? (total * Number(data.discount_value)) / 100 : Number(data.discount_value);
    setDiscount(disc);
    toast({ title: `Coupon applied! You save ${formatPrice(disc)}` });
  };

  const gstAmount = gstSettings.gst_enabled ? calculatedGstAmount : 0;

  // CRITICAL FIX: GST is already included in product prices (tax_inclusive = true)
  // Do NOT add gstAmount to total - this would double-charge the customer
  // Final total = product subtotal (GST-inclusive) + delivery - discount
  const grandTotal = total - discount + deliveryCharge;

  // Show loading state while auth is initializing
  if (authLoading) {
    return <Loader text="Preparing secure checkout..." className="min-h-[60vh]" delay={200} />;
  }

  if (!user) return null;

  const placeOrder = async () => {
    if (!selectedAddress || !selectedAddress.full_name || !selectedAddress.phone || !selectedAddress.address_line1 || !selectedAddress.pincode) {
      toast({ title: 'Please select or add a delivery address', variant: 'destructive' }); return;
    }
    setLoading(true);
    try {
      // Calculate MRP and selling totals
      const totalMRP = items.reduce((a, i) => a + ((i.product as any).compare_price || i.product.price) * i.quantity, 0);
      const sellingTotal = items.reduce((a, i) => a + i.product.price * i.quantity, 0);
      const discount = totalMRP - sellingTotal;

      // Determine GST type based on state
      const gstType = getGSTType(selectedAddress.state || '');
      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

      if (gstType === 'cgst_sgst') {
        cgstAmount = gstAmount / 2;
        sgstAmount = gstAmount / 2;
      } else {
        igstAmount = gstAmount;
      }

      const avgGstPercentage = total > 0 ? (gstAmount / total) * 100 : 0;

      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user!.id,
        order_number: 'temp',
        subtotal: sellingTotal,
        delivery_charge: deliveryCharge,
        discount,
        total: grandTotal,
        gst_amount: gstAmount,
        gst_percentage: avgGstPercentage,
        gst_type: gstType,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        delivery_state: selectedAddress.state || '',
        coupon_code: couponCode || null,
        payment_method: paymentMethod as any,
        payment_status: 'pending',
        delivery_address: selectedAddress as any,
        notes: notes || null,
      }).select().single();
      if (error) throw error;

      const orderItems = items.map(item => {
        const productGst = productGstMap.get(item.product_id) || {};
        const itemGstPercentage = (productGst as any)?.gst_percentage || 5;
        const itemBasePrice = (productGst as any)?.tax_inclusive ?
          item.product.price * 100 / (100 + itemGstPercentage) :
          item.product.price;
        const itemGstAmount = (itemBasePrice * itemGstPercentage / 100) * item.quantity;

        return {
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product.name,
          product_price: item.product.price,
          quantity: item.quantity,
          total: item.product.price * item.quantity,
          gst_percentage: itemGstPercentage,
          hsn_code: (productGst as any)?.hsn_code || '',
          gst_amount: itemGstAmount,
          tax_inclusive: (productGst as any)?.tax_inclusive ?? true,
          product_base_price: itemBasePrice,
        };
      });
      await supabase.from('order_items').insert(orderItems);
      clearCart();
      
      // Set popup state - redirect handled by useEffect
      setSavedAmount(discount);
      setNewOrderId(order.id);
      setOrderPlaced(true);
    } catch (err: any) {
      toast({ title: 'Order failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
      {/* Success Modal */}
      {orderPlaced && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-md" style={{ pointerEvents: 'none' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-md text-center" style={{ pointerEvents: 'auto', animation: 'scaleIn 0.3s ease-out' }}>
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold mb-3">Order Confirmed!</h2>
            {savedAmount > 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 mb-3">
                <p className="text-green-700 font-bold text-xl">
                  You saved {formatPrice(Math.round(savedAmount))}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Redirecting to order details in 2 seconds...
            </p>
          </div>
        </div>
      )}

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
              <Textarea placeholder="Any special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
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
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator className="mb-4" />
            
            {/* Flipkart-Style Pricing Breakdown */}
            {(() => {
              // Calculate MRP total and selling total
              const totalMRP = items.reduce((a, i) => {
                const comparePrice = (i.product as any).compare_price;
                return a + (comparePrice && comparePrice > i.product.price ? comparePrice : i.product.price) * i.quantity;
              }, 0);
              const sellingTotal = items.reduce((a, i) => a + i.product.price * i.quantity, 0);
              const discountAmount = totalMRP - sellingTotal;
              const hasDiscount = discountAmount > 0;
              
              return (
                <div className="space-y-2 text-sm mb-4">
                  {hasDiscount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MRP Total</span>
                      <span className="font-medium">{formatPrice(totalMRP)}</span>
                    </div>
                  )}
                  {hasDiscount && (
                    <div className="flex justify-between text-green-700 font-semibold">
                      <span>Discount</span>
                      <span>− {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>{formatPrice(sellingTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{deliveryCharge === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatPrice(deliveryCharge)}</span>
                  </div>
                  {hasDiscount && (
                    <div className="bg-green-50 border-2 border-green-200 text-green-800 rounded-lg p-3 mt-2 text-center">
                      <span className="font-bold text-base">🎉 You saved {formatPrice(discountAmount)} on this order</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Included Taxes - Compact */}
            {gstSettings.gst_enabled && gstAmount > 0 && (
              <div className="mb-3 pt-2 text-xs">
                <p className="text-muted-foreground">Included Taxes: {formatPrice(gstAmount)}</p>
              </div>
            )}

            <Separator className="my-3" />
            {(() => {
              const sellingTotal = items.reduce((a, i) => a + i.product.price * i.quantity, 0);
              const finalTotal = sellingTotal + deliveryCharge;
              return (
                <div className="flex justify-between text-lg font-bold mt-3">
                  <span>Total Payable</span>
                  <span className="text-primary">{formatPrice(finalTotal)}</span>
                </div>
              );
            })()}

            {selectedAddress && selectedAddress.full_name && (
              <div className="border-t mt-4 pt-3">
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
              {loading ? <ButtonLoader text="Placing order..." /> : `Place Order · ${formatPrice(grandTotal)}`}
            </Button>

            {/* Trust badges */}
            <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Secure Checkout</div>
              <div className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Fast Delivery</div>
              <div className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Quality Assured</div>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

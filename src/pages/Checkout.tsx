import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, MapPin, ShieldCheck, Truck, Award, AlertCircle, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useShippingRegions } from '@/hooks/useShippingRegions';
import AddressManager, { Address } from '@/components/AddressManager';
import { formatPrice } from '@/lib/formatters';
import { ButtonLoader, Loader } from '@/components/ui/loader';
import { STATE_ZONES, getChargedWeight, calculateDeliveryCharge, type ShippingZoneConfig } from '@/lib/deliveryCalculations';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = 'rzp_test_SOl9lqqJlvN9Ln';

const getGSTType = (state: string): 'cgst_sgst' | 'igst' => {
  const sameStateStates = ['Tamil Nadu', 'Puducherry'];
  return sameStateStates.includes(state) ? 'cgst_sgst' : 'igst';
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, total, clearCart } = useCart();
  const { regions, getDeliveryCharge, getZoneConfig } = useShippingRegions();
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [gstSettings, setGstSettings] = useState({ gst_enabled: false });
  const [productGstMap, setProductGstMap] = useState<Map<string, any>>(new Map());
  const [calculatedGstAmount, setCalculatedGstAmount] = useState(0);

  // Derive delivery state from selected address pincode/state
  const deliveryState = selectedAddress?.state || '';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user && items.length === 0) {
      navigate('/cart');
      return;
    }
    supabase.from('store_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        setGstSettings({ gst_enabled: (data as any).gst_enabled || false });
      }
    });
  }, [user, items.length, authLoading]);

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
      let totalGst = 0;
      items.forEach(item => {
        const productGst = gstMap.get(item.product_id) || {};
        const itemGstPercentage = (productGst as any)?.gst_percentage || 5;
        const itemBasePrice = (productGst as any)?.tax_inclusive
          ? item.product.price * 100 / (100 + itemGstPercentage)
          : item.product.price;
        const itemGstAmount = (itemBasePrice * itemGstPercentage / 100) * item.quantity;
        totalGst += itemGstAmount;
      });
      setCalculatedGstAmount(totalGst);
    };
    fetchProductGst();
  }, [items]);

  // Weight-based delivery calculation
  const totalWeightKg = useMemo(() => {
    return items.reduce((sum, item) => {
      const wkg = Number((item.product as any).weight_kg) || 0;
      return sum + wkg * item.quantity;
    }, 0);
  }, [items]);

  const chargedWeight = useMemo(() => getChargedWeight(totalWeightKg), [totalWeightKg]);

  const zoneConfig = useMemo(() => getZoneConfig(), [getZoneConfig]);

  const deliveryCharge = useMemo(() => {
    if (!deliveryState) return null;
    return calculateDeliveryCharge(deliveryState, totalWeightKg, total, zoneConfig);
  }, [deliveryState, totalWeightKg, total, zoneConfig]);

  const effectiveDeliveryCharge = deliveryCharge ?? 0;

  // Free delivery nudge for Tamil Nadu
  const freeDeliveryNudge = useMemo(() => {
    if (!deliveryState || STATE_ZONES[deliveryState] !== 'local') return null;
    const threshold = zoneConfig.local.freeAbove;
    if (!threshold || total >= threshold) return null;
    const remaining = threshold - total;
    const progress = (total / threshold) * 100;
    return { remaining, progress, threshold };
  }, [deliveryState, total, zoneConfig]);

  const gstAmount = gstSettings.gst_enabled ? calculatedGstAmount : 0;
  const grandTotal = total - discount + effectiveDeliveryCharge;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!user) {
      toast({ title: 'Please login to apply coupon', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await supabase.rpc('validate_coupon' as any, {
        _coupon_code: couponCode.trim().toUpperCase(),
        _user_id: user.id,
        _order_total: total,
      });
      if (error) throw error;
      const validation = data?.[0];
      if (!validation || !validation.is_valid) {
        toast({ title: 'Invalid coupon', description: validation?.error_message || 'Could not apply coupon', variant: 'destructive' });
        return;
      }
      const disc = validation.discount_type === 'percentage'
        ? (total * Number(validation.discount_value)) / 100
        : Number(validation.discount_value);
      setDiscount(disc);
      toast({ title: `Coupon applied! You save ${formatPrice(disc)}` });
    } catch (err: any) {
      console.error('Coupon validation error:', err);
      toast({ title: 'Error', description: 'Failed to validate coupon', variant: 'destructive' });
    }
  };

  if (authLoading) {
    return <Loader text="Preparing secure checkout..." className="min-h-[60vh]" delay={200} />;
  }
  if (!user) return null;

  const createOrder = async () => {
    const totalMRP = items.reduce((a, i) => a + ((i.product as any).compare_price || i.product.price) * i.quantity, 0);
    const sellingTotal = items.reduce((a, i) => a + i.product.price * i.quantity, 0);
    const gstType = getGSTType(deliveryState || selectedAddress?.state || '');
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
      delivery_charge: effectiveDeliveryCharge,
      discount: discount,
      total: grandTotal,
      gst_amount: gstAmount,
      gst_percentage: avgGstPercentage,
      gst_type: gstType,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      delivery_state: deliveryState || selectedAddress?.state || '',
      coupon_code: couponCode || null,
      payment_method: paymentMethod === 'razorpay' ? 'stripe' as any : 'cod' as any,
      payment_status: 'pending' as any,
      delivery_address: selectedAddress as any,
      notes: notes || null,
    }).select().single();
    if (error) throw error;

    const orderItems = items.map(item => {
      const productGst = productGstMap.get(item.product_id) || {};
      const itemGstPercentage = (productGst as any)?.gst_percentage || 5;
      const itemBasePrice = (productGst as any)?.tax_inclusive
        ? item.product.price * 100 / (100 + itemGstPercentage)
        : item.product.price;
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

    if (couponCode && discount > 0) {
      await supabase.rpc('redeem_coupon' as any, {
        _coupon_code: couponCode.trim().toUpperCase(),
        _user_id: user!.id,
        _order_id: order.id,
      });
    }

    return order;
  };

  const handleRazorpayPayment = async () => {
    setPaymentError(null);
    if (!window.Razorpay) {
      setPaymentError('Payment gateway not loaded. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            amount: grandTotal,
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: { user_id: user.id },
          }),
        }
      );

      const razorpayOrder = await res.json();
      if (!res.ok) throw new Error(razorpayOrder.error || 'Failed to create payment order');

      const order = await createOrder();

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'PANDIYIN Nature In Pack',
        description: `Order #${order.order_number}`,
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-verify`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: order.id,
                }),
              }
            );
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              clearCart();
              navigate(`/order-confirmation/${order.id}`);
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
            }
          } catch (err: any) {
            setPaymentError(err.message || 'Verification error. Please try again.');
          }
        },
        prefill: {
          name: selectedAddress?.full_name || '',
          contact: selectedAddress?.phone || '',
        },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: () => {
            supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
            setPaymentError('Payment cancelled. Your order has been saved. You can retry payment.');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
        setPaymentError(response.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress || !selectedAddress.full_name || !selectedAddress.phone || !selectedAddress.address_line1 || !selectedAddress.pincode) {
      toast({ title: 'Please select or add a delivery address', variant: 'destructive' });
      return;
    }
    if (!deliveryState) {
      toast({ title: 'Please select your delivery state', variant: 'destructive' });
      return;
    }
    if (!agreementChecked) {
      toast({ title: 'Please agree to our policies', description: 'You must accept our Terms of Service, Return Policy and Shipping Policy to proceed', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder();
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (err: any) {
      toast({ title: 'Order failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isCartEmpty = items.length === 0;

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
      <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

      {paymentError && (
        <div className="mb-6 border border-destructive/30 bg-destructive/5 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive text-sm">Payment Issue</p>
            <p className="text-sm text-muted-foreground mt-1">{paymentError}</p>
          </div>
          <button onClick={() => setPaymentError(null)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

          {/* Delivery State Selection */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5" /> Delivery State</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={deliveryState} onValueChange={setDeliveryState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your delivery state" />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_GROUPS.map(group => (
                    <SelectGroup key={group.zone}>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</SelectLabel>
                      {group.states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>

              {!deliveryState && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Select state to see delivery cost
                </p>
              )}

              {/* Free Delivery Nudge — Tamil Nadu only */}
              {freeDeliveryNudge && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-primary">
                    🚚 Add {formatPrice(freeDeliveryNudge.remaining)} more for FREE delivery!
                  </p>
                  <Progress value={freeDeliveryNudge.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Free delivery on orders above {formatPrice(freeDeliveryNudge.threshold!)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Payment Method</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div className={`flex items-center gap-3 p-3 border rounded-lg ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="razorpay" id="razorpay" />
                  <Label htmlFor="razorpay" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-5 w-5" /> Pay Online (UPI / Cards / Net Banking)
                  </Label>
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

            {(() => {
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

                  {/* Shipping Weight */}
                  {chargedWeight > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Shipping weight</span>
                      <span>{chargedWeight} kg</span>
                    </div>
                  )}

                  {/* Delivery charge */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>
                      {deliveryCharge === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : deliveryCharge === 0 ? (
                        <span className="text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full text-xs">FREE</span>
                      ) : (
                        formatPrice(deliveryCharge)
                      )}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-green-700 font-semibold">
                      <span>Coupon Discount {couponCode && `(${couponCode})`}</span>
                      <span>− {formatPrice(discount)}</span>
                    </div>
                  )}
                  {(hasDiscount || discount > 0) && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2 text-center">
                      <span className="font-bold text-base text-primary">
                        🎉 You saved {formatPrice(discountAmount + discount)} on this order
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {gstSettings.gst_enabled && gstAmount > 0 && (
              <div className="mb-3 pt-2 text-xs">
                <p className="text-muted-foreground">Included Taxes: {formatPrice(gstAmount)}</p>
              </div>
            )}

            <Separator className="my-3" />
            <div className="flex justify-between text-lg font-bold mt-3">
              <span>Total Payable</span>
              <span className="text-primary">{formatPrice(grandTotal)}</span>
            </div>

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

            <div className="mt-4 flex gap-3 items-start p-3 bg-muted rounded-lg border">
              <input
                type="checkbox"
                id="agreement"
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="mt-1 cursor-pointer w-4 h-4"
              />
              <label htmlFor="agreement" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                I agree to the{" "}
                <a href="/terms" className="text-primary hover:underline font-semibold">Terms of Service</a>,{" "}
                <a href="/return-refund" className="text-primary hover:underline font-semibold">Return & Refund Policy</a>
                {" "}and{" "}
                <a href="/shipping-policy" className="text-primary hover:underline font-semibold">Shipping Policy</a>
              </label>
            </div>

            <Button
              className="w-full mt-6 rounded-full"
              size="lg"
              onClick={placeOrder}
              disabled={loading || !agreementChecked || isCartEmpty || !deliveryState}
            >
              {loading ? <ButtonLoader text="Processing payment..." /> : `Pay Now · ${formatPrice(grandTotal)}`}
            </Button>

            {!deliveryState && (
              <p className="text-xs text-destructive mt-2 text-center">Please select your delivery state to proceed</p>
            )}

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

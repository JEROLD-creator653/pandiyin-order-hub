import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ShoppingBag, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { formatPrice } from '@/lib/formatters';
import { generateInvoicePdf } from '@/lib/invoicePdf';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || !user || authLoading) return;

    const fetchOrder = async () => {
      // Fetch order with authorization check
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // If no data returned, could be unauthorized or not found
      // Don't reveal which to prevent enumeration
      if (!orderData || error) {
        setUnauthorized(true);
        return;
      }

      // Server-side authorization: Check if user owns this order or is admin
      if (orderData.user_id !== user.id && !isAdmin) {
        setUnauthorized(true);
        return;
      }

      setOrder(orderData);

      // Fetch related data
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);
      setItems(itemsData || []);

      const { data: storeData } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      setStore(storeData);
    };

    fetchOrder();
  }, [id, user, isAdmin, authLoading]);

  const address = order?.delivery_address as any;

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show error if unauthorized (prevents order ID enumeration)
  if (unauthorized) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-lg">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-center mb-8">
            <AlertCircle className="h-20 w-20 text-destructive mx-auto mb-6" />
            <h1 className="text-3xl font-display font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You don't have permission to view this page.</p>
            <Button asChild><Link to="/">Go Home</Link></Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleDownload = (type: 'receipt' | 'invoice') => {
    if (!order || !store) return;
    
    const doc = generateInvoicePdf({
      storeName: store.store_name,
      storeAddress: store.address || '',
      storePhone: store.phone || '',
      storeEmail: store.email || '',
      gstNumber: (store as any).gst_enabled ? (store as any).gst_number : undefined,
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      customerName: address?.full_name || '',
      customerAddress: `${address?.address_line1 || ''}${address?.address_line2 ? `, ${address.address_line2}` : ''}, ${address?.city || ''}, ${address?.state || ''} - ${address?.pincode || ''}`,
      customerPhone: `+91 ${address?.phone || ''}`,
      items: items.map(i => ({ name: i.product_name, quantity: i.quantity, price: Number(i.product_price), total: Number(i.total), gst: Number(i.gst_amount || 0), hsn: i.hsn_code, gstPercentage: Number(i.gst_percentage || 0) })),
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.delivery_charge),
      discount: Number(order.discount),
      couponCode: order.coupon_code || undefined,
      gstAmount: Number(order.gst_amount || 0),
      gstPercentage: Number(order.gst_percentage || 0),
      gstType: order.gst_type,
      cgstAmount: Number(order.cgst_amount || 0),
      sgstAmount: Number(order.sgst_amount || 0),
      igstAmount: Number(order.igst_amount || 0),
      total: Number(order.total),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
    });
    doc.save(`${type === 'receipt' ? 'Receipt' : 'Invoice'}-${order.order_number}.pdf`);
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 max-w-lg">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="text-center mb-8">
          <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-display font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">Thank you for your order. We'll get it ready for you soon.</p>
        </div>

        {order && (
          <Card className="overflow-hidden mb-6">
            {/* Receipt-style header */}
            <div className="bg-primary/5 px-6 py-4 text-center border-b">
              <p className="font-display font-bold text-lg">{store?.store_name || 'Store'}</p>
              {store?.address && <p className="text-[10px] text-muted-foreground">{store.address}</p>}
              {store?.phone && <p className="text-[10px] text-muted-foreground">Ph: {store.phone}</p>}
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Order meta */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Order #{order.order_number}</span>
                <span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Customer */}
              {address?.full_name && (
                <div className="text-xs">
                  <p className="font-medium">{address.full_name}</p>
                  <p className="text-muted-foreground">{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}</p>
                  <p className="text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                </div>
              )}

              <Separator />

              {/* Items */}
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product_name} <span className="text-xs">×{item.quantity}</span>
                    </span>
                    <span>{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{Number(order.delivery_charge) === 0 ? 'Free' : formatPrice(order.delivery_charge)}</span></div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Coupon Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
              </div>

              {/* Savings Banner */}
              {Number(order.discount) > 0 && (
                <div className="bg-green-50 border-2 border-green-200 text-green-800 rounded-lg p-2.5 text-center">
                  <span className="font-bold text-xs">
                    🎉 You saved {formatPrice(order.discount)} on this order
                  </span>
                </div>
              )}

              {/* GST Line - Single */}
              {Number(order.gst_amount) > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Including 5% in taxes</span>
                  <span>{formatPrice(Number(order.gst_amount))}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-base font-bold">
                <span>Total Payable</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</span>
                <span className="capitalize">Status: {order.status}</span>
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-muted-foreground">Thank you for shopping with us!</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <Button variant="outline" className="w-full gap-2" onClick={() => handleDownload('invoice')} disabled={!order || !store}>
            <FileText className="h-4 w-4" /> Download Invoice
          </Button>
          <div className="flex gap-3">
            <Button asChild className="flex-1"><Link to="/dashboard"><Package className="mr-2 h-4 w-4" /> My Orders</Link></Button>
            <Button asChild variant="outline" className="flex-1"><Link to="/products"><ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping</Link></Button>
          </div>

          {/* Legal Section */}
          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              <strong className="text-foreground">Need help?</strong>
            </p>
            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                <a href="/return-refund" className="text-primary hover:underline font-semibold">
                  Return & Refund Policy
                </a>{" "}
                •{" "}
                <a href="/shipping-policy" className="text-primary hover:underline font-semibold">
                  Shipping Policy
                </a>
              </p>
              <p className="text-muted-foreground">
                Email: pandiyinnatureinpack@gmail.com | Phone: 6383709933
              </p>
              <p className="text-muted-foreground">
                Review our complete{" "}
                <a href="/terms" className="text-primary hover:underline font-semibold">
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
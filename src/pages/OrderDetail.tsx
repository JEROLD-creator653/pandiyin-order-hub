import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, Settings, Leaf, MapPin, Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/formatters';
import { generateInvoicePdf } from '@/lib/invoicePdf';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: Package },
  { key: 'processing', label: 'Processing', icon: Settings },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const statusIndex: Record<string, number> = {
  pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4, cancelled: -1,
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('orders').select('*').eq('id', id).maybeSingle().then(({ data }) => setOrder(data));
    supabase.from('order_items').select('*, products(image_url)').eq('order_id', id).then(({ data }) => setItems(data || []));
    supabase.from('store_settings').select('*').limit(1).maybeSingle().then(({ data }) => setStore(data));
  }, [id]);

  if (!order) return (
    <div className="container mx-auto px-4 pt-24 pb-16 text-center">
      <p className="text-muted-foreground">Loading order...</p>
    </div>
  );

  const currentStep = statusIndex[order.status] ?? -1;
  const isCancelled = order.status === 'cancelled';
  const address = order.delivery_address as any;

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 gap-1">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to Orders</Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Order header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Order {order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Order Status</CardTitle></CardHeader>
          <CardContent>
            {isCancelled ? (
              <div className="flex items-center gap-3 text-destructive">
                <XCircle className="h-8 w-8" />
                <div>
                  <p className="font-semibold">Order Cancelled</p>
                  <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between relative">
                {/* Progress line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted z-0" />
                <div
                  className="absolute top-5 left-5 h-0.5 bg-primary z-0 transition-all duration-500"
                  style={{ width: `calc(${(currentStep / (statusSteps.length - 1)) * 100}% - 40px)` }}
                />
                {statusSteps.map((step, i) => {
                  const Icon = step.icon;
                  const isCompleted = i <= currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center z-10 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-[10px] mt-2 text-center max-w-[60px] ${isCompleted ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Items ({items.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Leaf className="h-5 w-5 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.product_price)}</p>
                </div>
                <span className="font-medium text-sm">{formatPrice(item.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary + Address side by side on larger screens */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Payment Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{order.delivery_charge == 0 ? 'Free' : formatPrice(order.delivery_charge)}</span></div>
              <Separator />
              <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-medium text-primary">{formatPrice(order.total)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Payment</span><span className="capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</span></div>
              <Separator className="my-2" />
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  if (!store) return;
                  const addr = order.delivery_address as any;
                  const doc = generateInvoicePdf({
                    storeName: store.store_name,
                    storeAddress: store.address || '',
                    storePhone: store.phone || '',
                    storeEmail: store.email || '',
                    gstNumber: (store as any).gst_enabled ? (store as any).gst_number : undefined,
                    orderNumber: order.order_number,
                    orderDate: new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                    customerName: addr?.full_name || '',
                    customerAddress: `${addr?.address_line1 || ''}${addr?.address_line2 ? `, ${addr.address_line2}` : ''}, ${addr?.city || ''}, ${addr?.state || ''} - ${addr?.pincode || ''}`,
                    customerPhone: addr?.phone || '',
                    items: items.map(i => ({ name: i.product_name, quantity: i.quantity, price: Number(i.product_price), total: Number(i.total) })),
                    subtotal: Number(order.subtotal),
                    deliveryCharge: Number(order.delivery_charge),
                    discount: Number(order.discount),
                    total: Number(order.total),
                    paymentMethod: order.payment_method,
                    paymentStatus: order.payment_status,
                  });
                  doc.save(`Invoice-${order.order_number}.pdf`);
                }}
                disabled={!store}
              >
                <Download className="h-3.5 w-3.5" /> Download Invoice
              </Button>
            </CardContent>
          </Card>

          {address && address.full_name && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivery Address</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{address.full_name}</p>
                <p className="text-muted-foreground">
                  {address.address_line1}
                  {address.address_line2 ? `, ${address.address_line2}` : ''}
                </p>
                <p className="text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                <p className="text-muted-foreground">{address.phone}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}

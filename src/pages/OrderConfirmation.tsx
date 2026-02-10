import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ShoppingBag, Download, FileText, Separator as SeparatorIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/formatters';
import { generateInvoicePdf } from '@/lib/invoicePdf';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('orders').select('*').eq('id', id).maybeSingle().then(({ data }) => setOrder(data));
    supabase.from('order_items').select('*').eq('order_id', id).then(({ data }) => setItems(data || []));
    supabase.from('store_settings').select('*').limit(1).maybeSingle().then(({ data }) => setStore(data));
  }, [id]);

  const address = order?.delivery_address as any;

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
      customerPhone: address?.phone || '',
      items: items.map(i => ({ name: i.product_name, quantity: i.quantity, price: Number(i.product_price), total: Number(i.total) })),
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.delivery_charge),
      discount: Number(order.discount),
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
                {Number(order.discount) > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{Number(order.delivery_charge) === 0 ? 'Free' : formatPrice(order.delivery_charge)}</span></div>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
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
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => handleDownload('receipt')} disabled={!order || !store}>
              <Download className="h-4 w-4" /> Receipt
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => handleDownload('invoice')} disabled={!order || !store}>
              <FileText className="h-4 w-4" /> Invoice
            </Button>
          </div>
          <div className="flex gap-3">
            <Button asChild className="flex-1"><Link to="/dashboard"><Package className="mr-2 h-4 w-4" /> My Orders</Link></Button>
            <Button asChild variant="outline" className="flex-1"><Link to="/products"><ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping</Link></Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

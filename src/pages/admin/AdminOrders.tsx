import { useEffect, useState } from 'react';
import { ChevronRight, Leaf, Search, Copy, FileText, Printer, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/formatters';
import { TableSkeleton } from '@/components/ui/loader';
import { generateInvoicePdf } from '@/lib/invoicePdf';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800', shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase.from('orders').select('*, order_items(*, products(image_url, name))').order('created_at', { ascending: false });
      if (filter !== 'all') q = q.eq('status', filter as any);
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        q = q.ilike('order_number', `%${debouncedSearch}%`);
      }
      const { data } = await q;
      setOrders(data || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [filter, debouncedSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status } as any).eq('id', id);
    toast({ title: `Order status updated to ${status}` });
    setDetail((prev: any) => (prev && prev.id === id ? { ...prev, status } : prev));
    setNewStatus(status);
    load();
  };

  const viewDetail = (order: any) => {
    setDetail(order);
    setOrderItems(order.order_items || []);
    setNewStatus(order.status);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  const copyOrderDetails = () => {
    if (!detail) return;
    const addr = detail.delivery_address as any;
    const items = orderItems.map(i => `${i.product_name} x${i.quantity} — ${formatPrice(i.total)}`).join('\n');
    const text = `Order: ${detail.order_number}\nDate: ${new Date(detail.created_at).toLocaleDateString('en-IN')}\nStatus: ${detail.status}\n\nItems:\n${items}\n\nSubtotal: ${formatPrice(detail.subtotal)}\nDelivery: ${formatPrice(detail.delivery_charge)}\nTotal: ${formatPrice(detail.total)}${addr ? `\n\nDelivery: ${addr.full_name}, ${addr.address_line1}, ${addr.city} - ${addr.pincode}` : ''}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Order details copied' });
  };

  const handleGenerateInvoice = async () => {
    if (!detail) return;
    try {
      const addr = detail.delivery_address as any;
      const orderDate = new Date(detail.created_at);
      const invoiceData = {
        invoiceNumber: detail.invoice_number || detail.order_number,
        orderDate: orderDate.toLocaleDateString('en-IN'),
        orderTime: orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        customerName: addr?.full_name || 'Customer',
        customerAddress: addr ? `${addr.address_line1}, ${addr.city} - ${addr.pincode}` : '',
        customerPhone: addr?.phone || '',
        customerState: addr?.state || 'Tamil Nadu',
        items: orderItems.map(i => ({
          name: i.product_name,
          hsn: i.hsn_code || '',
          quantity: i.quantity,
          price: i.product_price,
          total: i.total,
          gstPercentage: i.product_gst_percentage || 5,
        })),
        subtotal: detail.subtotal,
        deliveryCharge: detail.delivery_charge,
        discount: detail.discount,
        couponCode: detail.coupon_code || undefined,
        grandTotal: detail.total,
        paymentMethod: detail.payment_mode || detail.payment_method || '',
        paymentGateway: 'Razorpay',
        paymentStatus: detail.payment_status,
        paymentId: detail.stripe_payment_id || '',
      };
      const doc = await generateInvoicePdf(invoiceData);
      doc.save(`Invoice_${detail.order_number}.pdf`);
      toast({ title: 'Invoice generated' });
    } catch {
      toast({ title: 'Failed to generate invoice', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <h2 className="text-xl font-bold font-sans">Orders ({orders.length})</h2>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : orders.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No order found.</div>
          ) : (
            <div className="divide-y">
              {orders.map(o => {
                const items = o.order_items || [];
                const firstItem = items[0];
                const imageUrl = firstItem?.products?.image_url;
                const itemName = firstItem?.products?.name || 'Order';
                const matchesSearch = debouncedSearch && o.order_number?.toLowerCase().includes(debouncedSearch.toLowerCase());
                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`p-4 flex items-center gap-4 transition-colors cursor-pointer ${matchesSearch ? 'bg-yellow-50 ring-1 ring-yellow-100' : 'hover:bg-muted/40'}`}
                    onClick={() => viewDetail(o)}
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Leaf className="h-6 w-6 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{itemName}</span>
                        {items.length > 1 && <span className="text-muted-foreground font-normal text-xs">+{items.length - 1} more</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.order_number}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                          <SelectTrigger className="w-32 h-7 capitalize" onClick={(event) => event.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map(s => (
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="font-bold text-sm">{formatPrice(o.total)}</span>
                        {Number(o.discount) > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                            💰 {o.coupon_code || 'Discount'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-xl shadow-lg border-0 max-h-[85vh] overflow-y-auto">
          {detail && (() => {
            const addr = detail.delivery_address as any;
            const orderDate = new Date(detail.created_at);
            const paymentMethod = detail.payment_mode || detail.payment_method || '';
            const paymentMethodLabel = paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Card' : paymentMethod === 'netbanking' ? 'Net Banking' : paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase();

            return (
              <div className="bg-background">
                {/* SECTION 1 — ORDER HEADER */}
                <div className="px-6 pt-6 pb-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Order Receipt</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-foreground">{detail.order_number}</span>
                        <button onClick={() => copyToClipboard(detail.order_number, 'Order ID')} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="h-3.5 w-3.5" /></button>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="text-foreground">{orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="text-foreground">{orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={`${statusColors[detail.status]} capitalize text-xs px-2.5 py-0.5`}>{detail.status}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SECTION 2 — PAYMENT INFORMATION */}
                <div className="px-6 py-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Payment Information</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gateway</span>
                      <span className="text-foreground">Razorpay</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Method</span>
                      <span className="text-foreground">{paymentMethodLabel}</span>
                    </div>
                    {detail.stripe_payment_id && detail.stripe_payment_id !== '' && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Payment ID</span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-foreground">{detail.stripe_payment_id}</span>
                          <button onClick={() => copyToClipboard(detail.stripe_payment_id, 'Payment ID')} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="h-3.5 w-3.5" /></button>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Payment Status</span>
                      <Badge variant="outline" className={`capitalize text-xs px-2.5 py-0.5 ${detail.payment_status === 'paid' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{detail.payment_status}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SECTION 3 — DELIVERY ADDRESS */}
                {addr && (
                  <>
                    <div className="px-6 py-4">
                      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Delivery Address</p>
                      <div className="bg-muted/50 rounded-lg p-3.5 text-sm space-y-0.5">
                        <p className="font-semibold text-foreground">{addr.full_name}</p>
                        {addr.phone && <p className="text-muted-foreground">Phone: {addr.phone}</p>}
                        <p className="text-foreground">{addr.address_line1}</p>
                        {addr.address_line2 && <p className="text-foreground">{addr.address_line2}</p>}
                        <p className="text-foreground">{addr.city}{addr.district ? `, ${addr.district}` : ''} – {addr.pincode}</p>
                        <p className="text-foreground">{addr.state}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Customer Notes */}
                {detail.notes && detail.notes !== '' && (
                  <>
                    <div className="px-6 py-4">
                      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Customer Notes</p>
                      <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3.5 whitespace-pre-wrap">{detail.notes}</p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* SECTION 4 — ORDER ITEMS */}
                <div className="px-6 py-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Order Items</p>
                  <div className="text-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 pb-2 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <span className="col-span-6">Product</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Price</span>
                      <span className="col-span-2 text-right">Total</span>
                    </div>
                    {/* Table Rows */}
                    {orderItems.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 py-2.5 border-b border-dashed last:border-0 items-center">
                        <span className="col-span-6 font-medium text-foreground truncate">{item.product_name}</span>
                        <span className="col-span-2 text-center text-muted-foreground">{item.quantity}</span>
                        <span className="col-span-2 text-right text-muted-foreground">{formatPrice(item.product_price)}</span>
                        <span className="col-span-2 text-right font-medium text-foreground">{formatPrice(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* SECTION 5 — ORDER SUMMARY */}
                <div className="px-6 py-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Order Summary</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatPrice(detail.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="text-foreground">{Number(detail.delivery_charge) === 0 ? 'Free' : formatPrice(detail.delivery_charge)}</span>
                    </div>
                    {Number(detail.gst_amount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST</span>
                        <span className="text-foreground">{formatPrice(detail.gst_amount)}</span>
                      </div>
                    )}
                    {Number(detail.discount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount {detail.coupon_code && `(${detail.coupon_code})`}</span>
                        <span className="text-emerald-600 font-medium">-{formatPrice(detail.discount)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground text-base">Grand Total</span>
                      <span className="font-bold text-foreground text-base">{formatPrice(detail.total)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SECTION 6 — ORDER STATUS CONTROL */}
                <div className="px-6 py-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Update Order Status</p>
                  <div className="flex items-center gap-3">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="flex-1 h-9 capitalize"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={newStatus === detail.status}
                      onClick={() => updateStatus(detail.id, newStatus)}
                    >
                      Save Status
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* SECTION 7 — ADMIN ACTIONS */}
                <div className="px-6 py-4 flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleGenerateInvoice} className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Generate Invoice
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
                    <Printer className="h-3.5 w-3.5" /> Print Receipt
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyOrderDetails} className="gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" /> Copy Details
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800', shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const load = async () => {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter as any);
    const { data } = await q;
    setOrders(data || []);
  };
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status } as any).eq('id', id);
    toast({ title: `Order status updated to ${status}` });
    load();
  };

  const viewDetail = async (order: any) => {
    setDetail(order);
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    setOrderItems(data || []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sans">Orders ({orders.length})</h2>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                  <TableCell className="text-sm">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-bold">₹{o.total}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{o.payment_method}</Badge></TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => viewDetail(o)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Order {detail?.order_number}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[detail.status]}>{detail.status}</Badge></div>
                <div><span className="text-muted-foreground">Payment:</span> {detail.payment_method.toUpperCase()}</div>
                <div><span className="text-muted-foreground">Subtotal:</span> ₹{detail.subtotal}</div>
                <div><span className="text-muted-foreground">Delivery:</span> ₹{detail.delivery_charge}</div>
                <div><span className="text-muted-foreground">Discount:</span> ₹{detail.discount}</div>
                <div className="font-bold"><span className="text-muted-foreground">Total:</span> ₹{detail.total}</div>
              </div>
              {detail.delivery_address && (
                <div className="text-sm p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">Delivery Address</p>
                  <p>{(detail.delivery_address as any).full_name}, {(detail.delivery_address as any).phone}</p>
                  <p>{(detail.delivery_address as any).address_line1}, {(detail.delivery_address as any).city} - {(detail.delivery_address as any).pincode}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-sm mb-2">Items</p>
                {orderItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{item.product_name} ×{item.quantity}</span>
                    <span>₹{item.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

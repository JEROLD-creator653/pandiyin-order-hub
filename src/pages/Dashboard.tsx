import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setOrders(data || []));
  }, [user]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
          <Button asChild><Link to="/products">Start Shopping</Link></Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                    <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold">₹{o.total}</TableCell>
                    <TableCell><Badge className={statusColors[o.status] || ''}>{o.status}</Badge></TableCell>
                    <TableCell className="capitalize">{o.payment_method === 'cod' ? 'COD' : 'Online'}</TableCell>
                    <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

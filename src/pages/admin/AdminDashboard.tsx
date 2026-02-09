import { useEffect, useState } from 'react';
import { BarChart3, Package, ShoppingCart, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '@/lib/formatters';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ count: products }, { count: orders }, { data: orderData }, { count: customers }, { data: low }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('id, name, stock_quantity').lte('stock_quantity', 5).eq('is_available', true),
      ]);

      const { data: allOrders } = await supabase.from('orders').select('total, created_at');
      const revenue = allOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      // Group by date for chart
      const grouped: Record<string, number> = {};
      allOrders?.forEach(o => {
        const date = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        grouped[date] = (grouped[date] || 0) + Number(o.total);
      });
      setChartData(Object.entries(grouped).slice(-7).map(([date, total]) => ({ date, total })));

      setStats({ products: products || 0, orders: orders || 0, customers: customers || 0, revenue });
      setRecentOrders(orderData || []);
      setLowStock(low || []);
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-primary' },
    { label: 'Orders', value: stats.orders, icon: ShoppingCart, color: 'text-accent' },
    { label: 'Products', value: stats.products, icon: Package, color: 'text-chart-3' },
    { label: 'Customers', value: stats.customers, icon: Users, color: 'text-chart-4' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Revenue Overview</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(145, 40%, 28%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No revenue data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" /> Low Stock Alerts</CardTitle></CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All products are well stocked.</p>
            ) : (
              <div className="space-y-3">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{p.name}</span>
                    <Badge variant={p.stock_quantity === 0 ? 'destructive' : 'secondary'}>{p.stock_quantity} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(o => (
                <Link
                  key={o.id}
                  to="/admin/orders"
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/40 transition-colors rounded-md px-2 -mx-2"
                >
                  <div>
                    <p className="text-sm font-mono">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatPrice(o.total)}</p>
                    <Badge variant="secondary" className="capitalize text-xs">{o.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

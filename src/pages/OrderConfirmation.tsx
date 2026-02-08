import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('orders').select('*').eq('id', id).maybeSingle().then(({ data }) => setOrder(data));
  }, [id]);

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 text-center max-w-lg">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-display font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-6">Thank you for your order. We'll get it ready for you soon.</p>
        {order && (
          <Card className="p-6 text-left mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Order #</span><span className="font-mono">{order.order_number}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-primary">₹{order.total}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="capitalize">{order.status}</span></div>
            </div>
          </Card>
        )}
        <div className="flex gap-3 justify-center">
          <Button asChild><Link to="/dashboard"><Package className="mr-2 h-4 w-4" /> My Orders</Link></Button>
          <Button asChild variant="outline"><Link to="/products">Continue Shopping</Link></Button>
        </div>
      </motion.div>
    </div>
  );
}

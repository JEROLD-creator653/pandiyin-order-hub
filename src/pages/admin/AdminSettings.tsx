import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const [store, setStore] = useState({ store_name: '', phone: '', whatsapp: '', email: '', address: '' });
  const [delivery, setDelivery] = useState({ base_charge: '', free_delivery_above: '' });
  const [storeId, setStoreId] = useState('');
  const [deliveryId, setDeliveryId] = useState('');

  useEffect(() => {
    supabase.from('store_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) { setStore({ store_name: data.store_name, phone: data.phone || '', whatsapp: data.whatsapp || '', email: data.email || '', address: data.address || '' }); setStoreId(data.id); }
    });
    supabase.from('delivery_settings').select('*').eq('is_active', true).maybeSingle().then(({ data }) => {
      if (data) { setDelivery({ base_charge: String(data.base_charge), free_delivery_above: data.free_delivery_above ? String(data.free_delivery_above) : '' }); setDeliveryId(data.id); }
    });
  }, []);

  const saveStore = async () => {
    await supabase.from('store_settings').update(store).eq('id', storeId);
    toast({ title: 'Store settings saved' });
  };

  const saveDelivery = async () => {
    await supabase.from('delivery_settings').update({
      base_charge: Number(delivery.base_charge),
      free_delivery_above: delivery.free_delivery_above ? Number(delivery.free_delivery_above) : null,
    }).eq('id', deliveryId);
    toast({ title: 'Delivery settings saved' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Store Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Store Name</Label><Input value={store.store_name} onChange={e => setStore(s => ({ ...s, store_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Phone</Label><Input value={store.phone} onChange={e => setStore(s => ({ ...s, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={store.whatsapp} onChange={e => setStore(s => ({ ...s, whatsapp: e.target.value }))} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input value={store.email} onChange={e => setStore(s => ({ ...s, email: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={store.address} onChange={e => setStore(s => ({ ...s, address: e.target.value }))} /></div>
          <Button onClick={saveStore}><Save className="mr-2 h-4 w-4" /> Save Store Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Delivery Charges</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Base Delivery Charge (Rs.)</Label><Input type="number" value={delivery.base_charge} onChange={e => setDelivery(d => ({ ...d, base_charge: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Free Delivery Above (Rs.)</Label><Input type="number" value={delivery.free_delivery_above} onChange={e => setDelivery(d => ({ ...d, free_delivery_above: e.target.value }))} placeholder="Leave empty for no free delivery" /></div>
          <Button onClick={saveDelivery}><Save className="mr-2 h-4 w-4" /> Save Delivery Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}

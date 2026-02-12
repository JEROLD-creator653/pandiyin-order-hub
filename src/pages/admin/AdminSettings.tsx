import { useEffect, useState } from 'react';
import { Save, Truck, MapPin, Globe, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const [store, setStore] = useState({ store_name: '', phone: '', whatsapp: '', email: '', address: '', gst_enabled: false, gst_number: '' });
  const [storeId, setStoreId] = useState('');
  const [regions, setRegions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('store_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        setStore({
          store_name: data.store_name,
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          address: data.address || '',
          gst_enabled: (data as any).gst_enabled || false,
          gst_number: (data as any).gst_number || '',
        });
        setStoreId(data.id);
      }
    });
    loadRegions();
  }, []);

  const loadRegions = async () => {
    const { data } = await supabase.from('shipping_regions').select('*').order('sort_order');
    setRegions((data || []).map(r => ({ ...r, base_charge: String(r.base_charge), free_delivery_above: r.free_delivery_above ? String(r.free_delivery_above) : '' })));
  };

  const saveStore = async () => {
    setSaving(true);
    await supabase.from('store_settings').update({
      store_name: store.store_name,
      phone: store.phone,
      whatsapp: store.whatsapp,
      email: store.email,
      address: store.address,
      gst_enabled: store.gst_enabled,
      gst_number: store.gst_number,
    } as any).eq('id', storeId);
    toast({ title: 'Store settings saved' });
    setSaving(false);
  };

  const saveRegion = async (region: any) => {
    await supabase.from('shipping_regions').update({
      base_charge: Number(region.base_charge) || 0,
      free_delivery_above: region.free_delivery_above ? Number(region.free_delivery_above) : null,
      is_enabled: region.is_enabled,
    }).eq('id', region.id);
    toast({ title: `${region.region_name} settings saved` });
  };

  const updateRegion = (id: string, field: string, value: any) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const regionIcons: Record<string, any> = {
    local: MapPin,
    rest_of_india: Truck,
    international: Globe,
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input value={store.store_name} onChange={e => setStore(s => ({ ...s, store_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Phone</Label><Input value={store.phone} onChange={e => setStore(s => ({ ...s, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={store.whatsapp} onChange={e => setStore(s => ({ ...s, whatsapp: e.target.value }))} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input value={store.email} onChange={e => setStore(s => ({ ...s, email: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={store.address} onChange={e => setStore(s => ({ ...s, address: e.target.value }))} /></div>

          <Separator />

          {/* GST Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">GST Settings</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Enable GST billing for invoices</p>
              </div>
              <Switch checked={store.gst_enabled} onCheckedChange={v => setStore(s => ({ ...s, gst_enabled: v }))} />
            </div>
            {store.gst_enabled && (
              <div className="space-y-3 pl-1 border-l-2 border-primary/20 ml-1">
                <div className="pl-3 space-y-2">
                  <Label className="text-xs">GST Number (GSTIN)</Label>
                  <Input value={store.gst_number} onChange={e => setStore(s => ({ ...s, gst_number: e.target.value }))} placeholder="22AAAAA0000A1Z5" />
                  <p className="text-[10px] text-muted-foreground mt-1">GST percentage is set per-product in the Products section</p>
                </div>
              </div>
            )}
          </div>

          <Button onClick={saveStore} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Store Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Shipping & Delivery Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" /> Shipping & Delivery Configuration
          </CardTitle>
          <CardDescription>Configure regional delivery charges. Changes apply instantly to checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {regions.map(region => {
            const Icon = regionIcons[region.region_key] || Truck;
            return (
              <div key={region.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{region.region_name}</p>
                      {region.region_key === 'local' && (
                        <p className="text-[10px] text-muted-foreground">Tamil Nadu, Pondicherry, Puducherry</p>
                      )}
                      {region.region_key === 'international' && (
                        <p className="text-[10px] text-muted-foreground">Contact support for international orders</p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={region.is_enabled}
                    onCheckedChange={v => updateRegion(region.id, 'is_enabled', v)}
                  />
                </div>
                {region.is_enabled && region.region_key !== 'international' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Base Charge (₹)</Label>
                      <Input type="number" value={region.base_charge} onChange={e => updateRegion(region.id, 'base_charge', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Free Delivery Above (₹)</Label>
                      <Input type="number" value={region.free_delivery_above} onChange={e => updateRegion(region.id, 'free_delivery_above', e.target.value)} placeholder="No limit" />
                    </div>
                  </div>
                )}
                {region.is_enabled && region.region_key === 'international' && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Delivery Charge (₹)</Label>
                      <Input type="number" value={region.base_charge} onChange={e => updateRegion(region.id, 'base_charge', e.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      International shipping will show "Contact support" message at checkout when enabled.
                    </p>
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={() => saveRegion(region)}>
                  <Save className="mr-1.5 h-3 w-3" /> Save
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

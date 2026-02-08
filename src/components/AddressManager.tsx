import { useState, useEffect } from 'react';
import { Plus, MapPin, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface AddressManagerProps {
  onSelect?: (address: Omit<Address, 'id' | 'is_default'> & { id?: string }) => void;
  selectable?: boolean;
  selectedId?: string | null;
}

const emptyForm = { full_name: '', phone: '', address_line1: '', address_line2: '', city: 'Madurai', state: 'Tamil Nadu', pincode: '' };

export default function AddressManager({ onSelect, selectable = false, selectedId }: AddressManagerProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    setAddresses(data || []);
  };

  useEffect(() => { load(); }, [user]);

  // Auto-select default address on load
  useEffect(() => {
    if (selectable && onSelect && addresses.length > 0 && !selectedId) {
      const def = addresses.find(a => a.is_default) || addresses[0];
      onSelect({ id: def.id, full_name: def.full_name, phone: def.phone, address_line1: def.address_line1, address_line2: def.address_line2, city: def.city, state: def.state, pincode: def.pincode });
    }
  }, [addresses]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({ full_name: a.full_name, phone: a.phone, address_line1: a.address_line1, address_line2: a.address_line2 || '', city: a.city, state: a.state, pincode: a.pincode });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!user || !form.full_name || !form.phone || !form.address_line1 || !form.pincode) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    const payload = { ...form, user_id: user.id, is_default: addresses.length === 0 };
    if (editing) {
      await supabase.from('addresses').update(form).eq('id', editing.id);
      toast({ title: 'Address updated' });
    } else {
      await supabase.from('addresses').insert(payload);
      toast({ title: 'Address saved' });
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    toast({ title: 'Address removed' });
    load();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    toast({ title: 'Default address updated' });
    load();
  };

  const selectAddress = (a: Address) => {
    if (onSelect) {
      onSelect({ id: a.id, full_name: a.full_name, phone: a.phone, address_line1: a.address_line1, address_line2: a.address_line2, city: a.city, state: a.state, pincode: a.pincode });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Saved Addresses</h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={openNew} className="gap-1 rounded-full text-xs">
              <Plus className="h-3 w-3" /> Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? 'Edit Address' : 'Add Address'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Phone *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Address Line 1 *</Label><Input value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Address Line 2</Label><Input value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Pincode *</Label><Input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} /></div>
              </div>
              <Button onClick={save} className="w-full">{editing ? 'Update' : 'Save'} Address</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No saved addresses yet. Add one for quick checkout!</p>
      )}

      <div className="grid gap-2">
        {addresses.map(a => {
          const isSelected = selectedId === a.id;
          return (
            <Card
              key={a.id}
              className={`cursor-pointer transition-all ${selectable ? 'hover:border-primary' : ''} ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`}
              onClick={() => selectable && selectAddress(a)}
            >
              <CardContent className="p-3 flex items-start gap-3">
                {selectable && (
                  <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                    {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{a.full_name}</span>
                    {a.is_default && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Default</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}, {a.city} - {a.pincode}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.phone}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {!a.is_default && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDefault(a.id)} title="Set as default">
                      <MapPin className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(a.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

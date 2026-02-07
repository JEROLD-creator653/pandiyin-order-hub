import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: '', max_uses: '', is_active: true, expires_at: '' });

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const data: any = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      is_active: form.is_active,
      expires_at: form.expires_at || null,
    };
    if (editing) {
      await supabase.from('coupons').update(data).eq('id', editing.id);
      toast({ title: 'Coupon updated' });
    } else {
      await supabase.from('coupons').insert(data);
      toast({ title: 'Coupon created' });
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    toast({ title: 'Coupon deleted' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sans">Coupons</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: '', max_uses: '', is_active: true, expires_at: '' }); }}><Plus className="mr-2 h-4 w-4" /> Create Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Create'} Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="SAVE20" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed ₹</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Value</Label><Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Min Order ₹</Label><Input type="number" value={form.min_order_value} onChange={e => setForm(f => ({ ...f, min_order_value: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Max Uses</Label><Input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" /></div>
              </div>
              <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
              <Button onClick={save} className="w-full">{editing ? 'Update' : 'Create'} Coupon</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Min Order</TableHead><TableHead>Used</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {coupons.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</TableCell>
                  <TableCell>₹{c.min_order_value}</TableCell>
                  <TableCell>{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</TableCell>
                  <TableCell><Badge className={c.is_active ? 'bg-green-100 text-green-800' : ''}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), min_order_value: String(c.min_order_value || ''), max_uses: c.max_uses ? String(c.max_uses) : '', is_active: c.is_active, expires_at: c.expires_at ? c.expires_at.split('T')[0] : '' }); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

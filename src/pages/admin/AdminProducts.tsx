import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', compare_price: '', category_id: '', stock_quantity: '', weight: '', unit: '', is_available: true, is_featured: false, image_url: '' });

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setProducts(p || []);
    setCategories(c || []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', compare_price: '', category_id: '', stock_quantity: '', weight: '', unit: '', is_available: true, is_featured: false, image_url: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), compare_price: p.compare_price ? String(p.compare_price) : '', category_id: p.category_id || '', stock_quantity: String(p.stock_quantity), weight: p.weight || '', unit: p.unit || '', is_available: p.is_available, is_featured: p.is_featured, image_url: p.image_url || '' });
    setDialogOpen(true);
  };

  const save = async () => {
    const data = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      category_id: form.category_id || null,
      stock_quantity: Number(form.stock_quantity),
      weight: form.weight,
      unit: form.unit,
      is_available: form.is_available,
      is_featured: form.is_featured,
      image_url: form.image_url,
    };
    if (editing) {
      await supabase.from('products').update(data).eq('id', editing.id);
      toast({ title: 'Product updated' });
    } else {
      await supabase.from('products').insert(data);
      toast({ title: 'Product added' });
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast({ title: 'Product deleted' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sans">Products ({products.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Compare Price</Label><Input type="number" value={form.compare_price} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Stock</Label><Input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Weight</Label><Input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Unit</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="g/kg/ml" /></div>
              </div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.is_available} onCheckedChange={v => setForm(f => ({ ...f, is_available: v }))} /><Label>Available</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} /><Label>Featured</Label></div>
              </div>
              <Button onClick={save} className="w-full">{editing ? 'Update' : 'Add'} Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Leaf className="h-5 w-5 text-muted-foreground/50" />}
                      </div>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.categories?.name || '-'}</TableCell>
                  <TableCell className="font-bold">₹{p.price}</TableCell>
                  <TableCell><Badge variant={p.stock_quantity <= 5 ? 'destructive' : 'secondary'}>{p.stock_quantity}</Badge></TableCell>
                  <TableCell>{p.is_available ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Hidden</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
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

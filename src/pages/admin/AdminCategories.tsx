import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TableSkeleton } from '@/components/ui/loader';

interface BestsellersRow {
  id: string;                    // store_settings row id
  bestsellers_label: string;
  bestsellers_sort_order: number;
  bestsellers_enabled: boolean;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<BestsellersRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', sort_order: '0' });
  const [bestsellersDialogOpen, setBestsellersDialogOpen] = useState(false);
  const [bestsellersForm, setBestsellersForm] = useState({ label: 'Bestsellers', sort_order: '-1' });
  const [loading, setLoading] = useState(true);
  const [savingBestsellers, setSavingBestsellers] = useState(false);

  const load = async () => {
    setLoading(true);
    const [catsRes, settingsRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase
        .from('store_settings')
        .select('id, bestsellers_label, bestsellers_sort_order, bestsellers_enabled')
        .limit(1)
        .maybeSingle(),
    ]);
    setCategories(catsRes.data || []);
    if (settingsRes.data) {
      setBestsellers(settingsRes.data as BestsellersRow);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const data = { name: form.name, description: form.description, sort_order: Number(form.sort_order) };
    if (editing) {
      await supabase.from('categories').update(data).eq('id', editing.id);
      toast({ title: 'Category updated' });
    } else {
      await supabase.from('categories').insert(data);
      toast({ title: 'Category added' });
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    toast({ title: 'Category deleted' });
    load();
  };

  const toggleBestsellersEnabled = async (enabled: boolean) => {
    if (!bestsellers) return;
    setBestsellers({ ...bestsellers, bestsellers_enabled: enabled });
    const { error } = await supabase
      .from('store_settings')
      .update({ bestsellers_enabled: enabled })
      .eq('id', bestsellers.id);
    if (error) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
      load();
    } else {
      toast({ title: enabled ? 'Bestsellers tab enabled' : 'Bestsellers tab hidden' });
    }
  };

  const openBestsellersEdit = () => {
    if (!bestsellers) return;
    setBestsellersForm({
      label: bestsellers.bestsellers_label,
      sort_order: String(bestsellers.bestsellers_sort_order),
    });
    setBestsellersDialogOpen(true);
  };

  const saveBestsellers = async () => {
    if (!bestsellers) return;
    setSavingBestsellers(true);
    const { error } = await supabase
      .from('store_settings')
      .update({
        bestsellers_label: bestsellersForm.label.trim() || 'Bestsellers',
        bestsellers_sort_order: Number(bestsellersForm.sort_order) || 0,
      })
      .eq('id', bestsellers.id);
    setSavingBestsellers(false);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Bestsellers tab updated' });
    setBestsellersDialogOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sans">Categories</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ name: '', description: '', sort_order: '0' }); }}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} /></div>
              <Button onClick={save} className="w-full">{editing ? 'Update' : 'Add'} Category</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Order</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {/* Bestsellers virtual row — controls the homepage Bestsellers tab */}
                {bestsellers && (
                  <TableRow className="bg-amber-50/40 hover:bg-amber-50/60">
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        {bestsellers.bestsellers_label}
                        <Badge variant="secondary" className="text-[10px]">Special</Badge>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Auto-shows products marked as Featured. Edit label & order, or hide from homepage.
                    </TableCell>
                    <TableCell>{bestsellers.bestsellers_sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end items-center">
                        <Switch
                          checked={bestsellers.bestsellers_enabled}
                          onCheckedChange={toggleBestsellersEnabled}
                          aria-label="Show Bestsellers tab"
                        />
                        <Button variant="ghost" size="icon" onClick={openBestsellersEdit} aria-label="Edit Bestsellers tab">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {categories.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                    <TableCell>{c.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || '', sort_order: String(c.sort_order) }); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Tip: Lower <span className="font-semibold">Order</span> = appears first. Use a negative value (e.g. <code>-1</code>) to push the Bestsellers tab to the very front.
      </p>

      {/* Edit Bestsellers dialog */}
      <Dialog open={bestsellersDialogOpen} onOpenChange={setBestsellersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> Edit Bestsellers Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tab Label</Label>
              <Input
                value={bestsellersForm.label}
                onChange={e => setBestsellersForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Bestsellers"
              />
              <p className="text-xs text-muted-foreground">Shown on the homepage tab (e.g. "Bestsellers", "Top Picks")</p>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={bestsellersForm.sort_order}
                onChange={e => setBestsellersForm(f => ({ ...f, sort_order: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Use a negative number (e.g. -1) to show first, or a number between categories to position it.</p>
            </div>
            <Button onClick={saveBestsellers} disabled={savingBestsellers} className="w-full">
              {savingBestsellers ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

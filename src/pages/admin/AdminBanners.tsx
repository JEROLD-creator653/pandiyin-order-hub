import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: '0' });

  const load = async () => {
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setBanners(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    await supabase.from('banners').insert({
      title: form.title, subtitle: form.subtitle, image_url: form.image_url,
      link_url: form.link_url, is_active: form.is_active, sort_order: Number(form.sort_order),
    });
    toast({ title: 'Banner added' });
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('banners').update({ is_active: active }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    toast({ title: 'Banner deleted' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sans">Banners</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: '0' })}><Plus className="mr-2 h-4 w-4" /> Add Banner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Banner</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Link URL</Label><Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
              <Button onClick={save} className="w-full">Add Banner</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map(b => (
          <Card key={b.id} className="overflow-hidden">
            <div className="h-40 bg-muted flex items-center justify-center">
              {b.image_url ? <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" /> : <span className="text-muted-foreground">No image</span>}
            </div>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={b.is_active} onCheckedChange={v => toggleActive(b.id, v)} />
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const categoryFilter = searchParams.get('category') || '';
  const searchFilter = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(searchFilter);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from('products').select('*, categories(name)').eq('is_available', true);
    if (categoryFilter) {
      const catIds = categories.filter(c => c.name === categoryFilter).map(c => c.id);
      if (catIds.length) query = query.in('category_id', catIds);
    }
    if (searchFilter) query = query.ilike('name', `%${searchFilter}%`);
    query.order('created_at', { ascending: false }).then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, [categoryFilter, searchFilter, categories]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-bold">
          {categoryFilter || 'All Products'}
        </h1>
        <form onSubmit={e => { e.preventDefault(); setSearchParams(s => { s.set('search', searchInput); return s; }); }} className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-9" />
        </form>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button variant={!categoryFilter ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setSearchParams({})}>
          All
        </Button>
        {categories.map(c => (
          <Button key={c.id} variant={categoryFilter === c.name ? 'default' : 'outline'} size="sm" className="rounded-full"
            onClick={() => setSearchParams({ category: c.name })}>
            {c.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Leaf className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No products found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/products/${p.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <Leaf className="h-12 w-12 text-muted-foreground/30" />
                    )}
                    {p.stock_quantity <= 5 && p.stock_quantity > 0 && (
                      <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs">Few Left</Badge>
                    )}
                    {p.stock_quantity === 0 && (
                      <Badge variant="destructive" className="absolute top-2 right-2 text-xs">Out of Stock</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{(p as any).categories?.name}</p>
                    <h3 className="font-semibold text-sm font-sans line-clamp-2 mb-2">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">₹{p.price}</span>
                      {p.compare_price && <span className="text-xs text-muted-foreground line-through">₹{p.compare_price}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

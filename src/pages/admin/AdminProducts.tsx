/**
 * Admin Products Management Page
 */

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { deleteProduct } from '@/lib/imageUpload';
import { formatPrice } from '@/lib/formatters';
import { TableSkeleton } from '@/components/ui/loader';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  category_id?: string;
  image_url: string;
  image_path: string;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  weight?: string | number;
  weight_kg?: number;
  unit?: string;
  gst_percentage?: number;
  hsn_code?: string;
  categories?: { name: string };
  created_at: string;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [{ data: p }] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      ]);
      setProducts((p as any) || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeleteProduct = async (productId: string, imagePath: string) => {
    try {
      await deleteProduct(productId, imagePath);
      toast.success('Product deleted successfully');
      setDeletingProductId(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => navigate('/admin/products/new')} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader><CardTitle>Product List ({products.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={10} columns={9} />
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No products yet. Create one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>GST %</TableHead>
                    <TableHead>HSN</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Leaf className="h-6 w-6 text-muted-foreground/50" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            {p.weight && <p className="text-xs text-muted-foreground">{p.weight}{p.unit}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.categories?.name || '-'}</TableCell>
                      <TableCell className="font-medium">{formatPrice(p.price)}</TableCell>
                      <TableCell><Badge variant="outline">{p.gst_percentage || 5}%</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.hsn_code || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {Number(p.weight_kg) > 0 ? `${(Number(p.weight_kg) * 1000).toFixed(0)}g` : '-'}
                      </TableCell>
                      <TableCell><Badge variant={p.stock_quantity <= 5 ? 'destructive' : 'secondary'}>{p.stock_quantity}</Badge></TableCell>
                      <TableCell>{p.is_available ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Hidden</Badge>}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/products/${p.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog open={deletingProductId === p.id} onOpenChange={open => { if (!open) setDeletingProductId(null); }}>
                            <Button variant="ghost" size="sm" onClick={() => setDeletingProductId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            <AlertDialogContent>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>This will delete the product and its image. This action cannot be undone.</AlertDialogDescription>
                              <div className="flex gap-2 justify-end">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(p.id, p.image_path)} className="bg-destructive">Delete</AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

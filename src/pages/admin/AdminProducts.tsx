/**
 * Admin Products Management Page
 */

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Leaf, Sparkles, Package, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { deleteProduct } from '@/lib/imageUpload';
import { formatPrice } from '@/lib/formatters';
import { TableSkeleton } from '@/components/ui/loader';
import { useNavigate } from 'react-router-dom';
import { formatProductUnit, getProductShippingWeightKg } from '@/lib/unitHelpers';

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
  is_combo?: boolean;
  combo_badge?: string;
  weight?: string | number;
  weight_kg?: number;
  unit?: string;
  unit_type?: string;
  quantity_count?: number;
  per_unit_weight?: number;
  per_unit_weight_unit?: string;
  calculated_shipping_weight?: number;
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
    } catch {
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

  const formatShippingWeight = (p: Product): string => {
    const kg = getProductShippingWeightKg(p);
    if (kg <= 0) return '-';
    if (kg >= 1) return `${kg.toFixed(2)} kg`;
    return `${Math.round(kg * 1000)} g`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => navigate('/admin/products/new')} className="gap-2 py-2.5 cursor-pointer">
              <Package className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-medium text-sm">Add Product</span>
                <span className="text-[10px] text-muted-foreground">Standard catalog item</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/products/new?type=combo')} className="gap-2 py-2.5 cursor-pointer">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <div className="flex flex-col">
                <span className="font-medium text-sm">Add Combo</span>
                <span className="text-[10px] text-muted-foreground">Bundle / festive pack</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>GST %</TableHead>
                    <TableHead>HSN</TableHead>
                    <TableHead>Ships as</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => {
                    const displayUnit = formatProductUnit(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Leaf className="h-6 w-6 text-muted-foreground/50" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{p.name}</p>
                              {displayUnit && <p className="text-xs text-muted-foreground">{displayUnit}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.is_combo ? (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-300 gap-1 text-[10px]">
                              <Sparkles className="h-3 w-3" />
                              {p.combo_badge || 'COMBO'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Product</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{p.categories?.name || '-'}</TableCell>
                        <TableCell className="font-medium">{formatPrice(p.price)}</TableCell>
                        <TableCell><Badge variant="outline">{p.gst_percentage || 5}%</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.hsn_code || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatShippingWeight(p)}</TableCell>
                        <TableCell><Badge variant={p.stock_quantity <= 5 ? 'destructive' : 'secondary'}>{p.stock_quantity}</Badge></TableCell>
                        <TableCell>{p.is_available ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Hidden</Badge>}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/products/${p.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog open={deletingProductId === p.id} onOpenChange={open => { if (!open) setDeletingProductId(null); }}>
                              <Button variant="ghost" size="sm" onClick={() => setDeletingProductId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              <AlertDialogContent>
                                <AlertDialogTitle>Delete {p.is_combo ? 'Combo' : 'Product'}</AlertDialogTitle>
                                <AlertDialogDescription>This will delete the {p.is_combo ? 'combo' : 'product'} and its images. This action cannot be undone.</AlertDialogDescription>
                                <div className="flex gap-2 justify-end">
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProduct(p.id, p.image_path)} className="bg-destructive">Delete</AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

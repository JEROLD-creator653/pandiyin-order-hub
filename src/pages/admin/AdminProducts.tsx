/**
 * Admin Products Management Page
 * Features:
 * - Create/edit products with image upload
 * - List all products
 * - Update product image
 * - Delete product with automatic storage cleanup
 * - Drag & drop support
 */

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Leaf, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  uploadAndSaveProductImage,
  deleteProduct,
  updateProductImage,
} from '@/lib/imageUpload';
import { formatPrice } from '@/lib/formatters';

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
  weight?: string;
  unit?: string;
  categories?: { name: string };
  created_at: string;
}

export default function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category_id: '',
    stock_quantity: '',
    weight: '',
    unit: '',
    is_available: true,
    is_featured: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase
          .from('products')
          .select('*, categories(name)')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ]);
      setProducts(p || []);
      setCategories(c || []);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      price: '',
      compare_price: '',
      category_id: '',
      stock_quantity: '',
      weight: '',
      unit: '',
      is_available: true,
      is_featured: false,
    });
    setSelectedFile(null);
    setUploadKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      compare_price: p.compare_price ? String(p.compare_price) : '',
      category_id: p.category_id || '',
      stock_quantity: String(p.stock_quantity),
      weight: p.weight || '',
      unit: p.unit || '',
      is_available: p.is_available,
      is_featured: p.is_featured,
    });
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) {
      toast.error('Product name is required');
      return;
    }

    if (!form.price) {
      toast.error('Product price is required');
      return;
    }

    // For new products, an image is required
    if (!editing && !selectedFile) {
      toast.error('Please upload a product image');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsUploadingImage(true);

      if (editing) {
        // Update existing product
        const updateData = {
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
        };

        // If a new image is selected, update it
        if (selectedFile) {
          await updateProductImage(
            editing.id,
            selectedFile,
            editing.image_path,
            user.id
          );
        }

        await supabase.from('products').update(updateData).eq('id', editing.id);

        toast.success('Product updated successfully');
      } else {
        // Create new product with image
        await uploadAndSaveProductImage(
          selectedFile!,
          {
            name: form.name,
            description: form.description,
            price: Number(form.price),
            category_id: form.category_id || undefined,
            stock_quantity: Number(form.stock_quantity) || 0,
          },
          user.id
        );

        toast.success('Product created successfully');
      }

      setDialogOpen(false);
      setForm({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        category_id: '',
        stock_quantity: '',
        weight: '',
        unit: '',
        is_available: true,
        is_featured: false,
      });
      setSelectedFile(null);
      setUploadKey((prev) => prev + 1);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save product';
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (productId: string, imagePath: string) => {
    try {
      await deleteProduct(productId, imagePath);
      toast.success('Product deleted successfully');
      setDeletingProductId(null);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Edit Product' : 'Add Product'}
              </DialogTitle>
              <DialogDescription>
                {editing ? 'Update product details and image' : 'Create a new product with image'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Image Upload */}
              {!editing && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Product Image *
                  </label>
                  <ImageUpload
                    key={uploadKey}
                    onImageSelect={(file) => setSelectedFile(file)}
                    disabled={isUploadingImage}
                    label="Upload Product Image"
                  />
                </div>
              )}

              {editing && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Update Product Image
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
                    <DialogHeader>
                      <DialogTitle>Update Product Image</DialogTitle>
                    </DialogHeader>
                    <ImageUpload
                      key={uploadKey}
                      onImageSelect={(file) => setSelectedFile(file)}
                      disabled={isUploadingImage}
                      label="Upload New Product Image"
                    />
                  </DialogContent>
                </Dialog>
              )}

              {/* Product Name */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Product Name *
                </label>
                <Input
                  placeholder="Product name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <Textarea
                  placeholder="Product description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price (Rs.) *
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Compare Price
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.compare_price}
                    onChange={(e) =>
                      setForm({ ...form, compare_price: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stock, Weight, Unit */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) =>
                      setForm({ ...form, stock_quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Weight
                  </label>
                  <Input
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Unit
                  </label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="g/kg/ml"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={form.is_available}
                    onChange={(e) =>
                      setForm({ ...form, is_available: e.target.checked })
                    }
                  />
                  <label htmlFor="is_available" className="text-sm font-medium">
                    Available
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm({ ...form, is_featured: e.target.checked })
                    }
                  />
                  <label htmlFor="is_featured" className="text-sm font-medium">
                    Featured
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isUploadingImage}
                >
                  Cancel
                </Button>
                <Button
                  onClick={save}
                  disabled={isUploadingImage || !form.name || !form.price}
                  className="gap-2"
                >
                  {isUploadingImage && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editing ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products yet. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Leaf className="h-6 w-6 text-muted-foreground/50" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            {p.weight && (
                              <p className="text-xs text-muted-foreground">
                                {p.weight}
                                {p.unit}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.categories?.name || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(p.price)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.stock_quantity <= 5 ? 'destructive' : 'secondary'
                          }
                        >
                          {p.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.is_featured ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.is_available ? (
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Hidden</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <AlertDialog
                            open={deletingProductId === p.id}
                            onOpenChange={(open) => {
                              if (!open) setDeletingProductId(null);
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingProductId(p.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <AlertDialogContent>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete the product and its image from
                                storage. This action cannot be undone.
                              </AlertDialogDescription>
                              <div className="flex gap-2 justify-end">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteProduct(p.id, p.image_path)
                                  }
                                  className="bg-destructive"
                                >
                                  Delete
                                </AlertDialogAction>
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

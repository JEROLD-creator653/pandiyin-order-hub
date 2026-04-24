/**
 * Admin Product Editor Page
 * Supports up to 3 product images (multi-image gallery).
 */

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/RichTextEditor';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import MultiImageUpload, { MultiImageItem } from '@/components/MultiImageUpload';
import { TableSkeleton } from '@/components/ui/loader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  uploadProductImages,
  deleteProductImagePaths,
  MAX_PRODUCT_IMAGES,
  BUCKET_NAMES,
} from '@/lib/imageUpload';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  category_id?: string;
  image_url: string;
  image_path: string;
  images?: string[] | null;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  weight?: string | number;
  weight_kg?: number;
  unit?: string;
  gst_percentage?: number;
  hsn_code?: string;
}

interface Category {
  id: string;
  name: string;
}

// Extract storage path from a Supabase public URL
function pathFromPublicUrl(url: string): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET_NAMES.PRODUCTS}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(url.substring(idx + marker.length));
  } catch {
    return null;
  }
}

export default function AdminProductEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = useMemo(() => Boolean(id), [id]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageItems, setImageItems] = useState<MultiImageItem[]>([]);

  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_price: '', category_id: '',
    stock_quantity: '', weight: '', unit: 'g',
    gst_percentage: '5', hsn_code: '',
    is_available: true, is_featured: false,
  });

  const computeWeightKg = (value: string, unit: string): number => {
    const num = Number(value) || 0;
    if (unit === 'kg') return num;
    if (unit === 'g') return num / 1000;
    return 0;
  };

  const applyProductToForm = (product: Product) => {
    const wkg = Number(product.weight_kg) || 0;
    const unit = product.unit || 'g';
    let weightDisplay = product.weight ? String(product.weight) : '';

    if (wkg > 0 && (unit === 'g' || unit === 'kg')) {
      weightDisplay = unit === 'kg' ? String(wkg) : String(Math.round(wkg * 1000));
    }

    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      compare_price: product.compare_price ? String(product.compare_price) : '',
      category_id: product.category_id || '',
      stock_quantity: String(product.stock_quantity),
      weight: weightDisplay,
      unit,
      gst_percentage: String(product.gst_percentage || 5),
      hsn_code: product.hsn_code || '',
      is_available: product.is_available,
      is_featured: product.is_featured,
    });

    // Build image items from existing data: prefer images[] array, fall back to image_url
    const existingUrls: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      existingUrls.push(...product.images.filter(Boolean));
    } else if (product.image_url) {
      existingUrls.push(product.image_url);
    }

    setImageItems(
      existingUrls.slice(0, MAX_PRODUCT_IMAGES).map((url, idx) => ({
        id: `existing_${idx}_${Math.random().toString(36).slice(2, 7)}`,
        url,
        existingPath: pathFromPublicUrl(url) || undefined,
      }))
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingPage(true);

        const [{ data: categoriesData }, productResponse] = await Promise.all([
          supabase.from('categories').select('id, name').order('sort_order'),
          isEditing
            ? supabase.from('products').select('*').eq('id', id as string).single()
            : Promise.resolve({ data: null, error: null } as const),
        ]);

        setCategories(categoriesData || []);

        if (productResponse?.error) throw productResponse.error;

        if (isEditing) {
          if (!productResponse?.data) {
            toast.error('Product not found');
            navigate('/admin/products');
            return;
          }

          setExistingProduct(productResponse.data as Product);
          applyProductToForm(productResponse.data as Product);
        }
      } catch (error) {
        toast.error('Failed to load product editor data');
        if (isEditing) {
          navigate('/admin/products');
        }
      } finally {
        setLoadingPage(false);
      }
    };

    loadData();
  }, [id, isEditing, navigate]);

  const save = async () => {
    if (!form.name) { toast.error('Product name is required'); return; }
    if (!form.price) { toast.error('Product price is required'); return; }
    if (imageItems.length === 0) { toast.error('Please add at least one product image'); return; }
    if (!user?.id) { toast.error('User not authenticated'); return; }

    try {
      setIsSaving(true);
      const weightKg = computeWeightKg(form.weight, form.unit);

      // Determine which existing images were removed (to delete from storage)
      const previousPaths = new Set(
        (existingProduct?.images || [])
          .map((u) => pathFromPublicUrl(u))
          .filter((p): p is string => Boolean(p))
      );
      if (existingProduct?.image_path) previousPaths.add(existingProduct.image_path);

      const keptPaths = new Set(
        imageItems
          .filter((i) => i.existingPath)
          .map((i) => i.existingPath!)
      );
      const pathsToDelete = Array.from(previousPaths).filter((p) => !keptPaths.has(p));

      // Upload any new files
      const newFiles = imageItems.filter((i) => i.file).map((i) => i.file!);
      const uploaded = newFiles.length > 0 ? await uploadProductImages(newFiles, user.id) : [];

      // Build the final ordered image URL list matching imageItems order
      let uploadedIdx = 0;
      const finalUrls: string[] = imageItems.map((item) => {
        if (item.existingPath) return item.url;
        const result = uploaded[uploadedIdx++];
        return result.imageUrl;
      });
      const primaryUrl = finalUrls[0];
      const primaryPath =
        imageItems[0].existingPath ||
        uploaded[0]?.imagePath ||
        '';

      const payload: any = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        category_id: form.category_id || null,
        stock_quantity: Number(form.stock_quantity),
        weight: form.weight ? String(form.weight) : '',
        weight_kg: weightKg,
        unit: form.unit,
        gst_percentage: Number(form.gst_percentage),
        hsn_code: form.hsn_code,
        is_available: form.is_available,
        is_featured: form.is_featured,
        image_url: primaryUrl,
        image_path: primaryPath,
        images: finalUrls,
      };

      if (isEditing && existingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', existingProduct.id);
        if (error) throw error;

        // Cleanup removed images (best-effort)
        if (pathsToDelete.length > 0) {
          await deleteProductImagePaths(pathsToDelete);
        }
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success('Product created successfully');
      }

      navigate('/admin/products');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{isEditing ? 'Edit Product' : 'Add Product'}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <TableSkeleton rows={8} columns={2} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2"
            onClick={() => navigate('/admin/products')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold">{isEditing ? 'Edit Product' : 'Add Product'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Update product details and images' : 'Create a new product with up to 3 images'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Product Details' : 'New Product Details'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Product Images <span className="text-muted-foreground font-normal">(up to {MAX_PRODUCT_IMAGES})</span>
            </label>
            <MultiImageUpload
              value={imageItems}
              onChange={setImageItems}
              maxImages={MAX_PRODUCT_IMAGES}
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Product Name *</label>
            <Input placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <RichTextEditor
              label="Description"
              placeholder="Enter product description..."
              value={form.description}
              onChange={content => setForm({ ...form, description: content })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Price (Rs.) *</label>
              <Input type="number" placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Compare Price</label>
              <Input type="number" placeholder="0.00" value={form.compare_price} onChange={e => setForm({ ...form, compare_price: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Stock Quantity</label>
              <Input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Weight *</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="1"
                  placeholder="e.g. 250"
                  value={form.weight}
                  onChange={e => setForm({ ...form, weight: e.target.value })}
                  className="flex-1"
                />
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="w-24"><SelectValue placeholder="Unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="l">l</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="pack">pack</SelectItem>
                    <SelectItem value="box">box</SelectItem>
                    <SelectItem value="bottle">bottle</SelectItem>
                    <SelectItem value="jar">jar</SelectItem>
                    <SelectItem value="combo">combo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.weight && (form.unit === 'g' || form.unit === 'kg') && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Shipping weight: {computeWeightKg(form.weight, form.unit).toFixed(3)} kg
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">GST Percentage</label>
              <Select value={form.gst_percentage} onValueChange={v => setForm({ ...form, gst_percentage: v })}>
                <SelectTrigger><SelectValue placeholder="Select GST rate" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Exempted)</SelectItem>
                  <SelectItem value="5">5% (Essential)</SelectItem>
                  <SelectItem value="12">12% (General)</SelectItem>
                  <SelectItem value="18">18% (Premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">HSN Code</label>
              <Input placeholder="e.g., 190590" value={form.hsn_code} onChange={e => setForm({ ...form, hsn_code: e.target.value })} maxLength={8} />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900 font-medium">All prices are GST-inclusive by default</p>
            <p className="text-xs text-blue-700 mt-1">The GST percentage selected will be automatically included in the displayed price on your website.</p>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_available" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} />
              <label htmlFor="is_available" className="text-sm font-medium">Available</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_featured" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
              <label htmlFor="is_featured" className="text-sm font-medium">Featured</label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => navigate('/admin/products')} disabled={isSaving}>Cancel</Button>
            <Button onClick={save} disabled={isSaving || !form.name || !form.price} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

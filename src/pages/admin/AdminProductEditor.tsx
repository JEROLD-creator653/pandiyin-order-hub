/**
 * Admin Product Editor Page
 * Supports normal products (up to 3 images) and combo products (up to 6 images),
 * plus universal unit/weight system (Group A: g/kg/ml/l, Group B: pcs/pack/bottle/jar/box/combo).
 */

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Package, Sparkles } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  MAX_COMBO_IMAGES,
  BUCKET_NAMES,
} from '@/lib/imageUpload';
import {
  isGroupA, isGroupB, computeShippingWeightKg, UNIT_LABELS, GROUP_A_UNITS, GROUP_B_UNITS,
} from '@/lib/unitHelpers';

interface Product {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
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
  unit_type?: string;
  quantity_count?: number;
  per_unit_weight?: number;
  per_unit_weight_unit?: string;
  gst_percentage?: number;
  hsn_code?: string;
  is_combo?: boolean;
  combo_badge?: string;
  tags?: string[];
}

interface Category {
  id: string;
  name: string;
}

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
  const [searchParams] = useSearchParams();

  const isEditing = useMemo(() => Boolean(id), [id]);
  // ?type=combo on the URL flips us into combo mode for new entries
  const initialIsCombo = searchParams.get('type') === 'combo';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageItems, setImageItems] = useState<MultiImageItem[]>([]);

  const [form, setForm] = useState({
    is_combo: initialIsCombo,
    combo_badge: 'COMBO DEAL',
    name: '',
    description: '',
    short_description: '',
    price: '',
    compare_price: '',
    category_id: '',
    stock_quantity: '',
    // Universal unit / weight
    unit_type: initialIsCombo ? 'combo' : 'g',
    weight: '',                        // for Group A
    quantity_count: '1',                // for Group B
    per_unit_weight: '',                // for Group B
    per_unit_weight_unit: 'g',          // for Group B
    gst_percentage: '5',
    hsn_code: '',
    is_available: true,
    is_featured: false,
  });

  const maxImages = form.is_combo ? MAX_COMBO_IMAGES : MAX_PRODUCT_IMAGES;

  // Live shipping-weight preview (kg)
  const previewShippingKg = useMemo(() => {
    return computeShippingWeightKg({
      unit_type: form.unit_type,
      weight: form.weight,
      quantity_count: Number(form.quantity_count) || 0,
      per_unit_weight: Number(form.per_unit_weight) || 0,
      per_unit_weight_unit: form.per_unit_weight_unit as 'g' | 'kg',
    });
  }, [form.unit_type, form.weight, form.quantity_count, form.per_unit_weight, form.per_unit_weight_unit]);

  const formatShipping = (kg: number) => {
    if (kg <= 0) return '—';
    if (kg >= 1) return `${kg.toFixed(3)} kg`;
    return `${Math.round(kg * 1000)} g`;
  };

  const applyProductToForm = (product: Product) => {
    const unitType = (product.unit_type || product.unit || 'g').toLowerCase();
    const isCombo = !!product.is_combo;

    setForm({
      is_combo: isCombo,
      combo_badge: product.combo_badge || (isCombo ? 'COMBO DEAL' : ''),
      name: product.name,
      description: product.description || '',
      short_description: product.short_description || '',
      price: String(product.price),
      compare_price: product.compare_price ? String(product.compare_price) : '',
      category_id: product.category_id || '',
      stock_quantity: String(product.stock_quantity),
      unit_type: unitType,
      weight: product.weight ? String(product.weight) : '',
      quantity_count: String(product.quantity_count ?? 1),
      per_unit_weight: product.per_unit_weight ? String(product.per_unit_weight) : '',
      per_unit_weight_unit: (product.per_unit_weight_unit as 'g' | 'kg') || 'g',
      gst_percentage: String(product.gst_percentage || 5),
      hsn_code: product.hsn_code || '',
      is_available: product.is_available,
      is_featured: product.is_featured,
    });

    const existingUrls: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      existingUrls.push(...product.images.filter(Boolean));
    } else if (product.image_url) {
      existingUrls.push(product.image_url);
    }

    const cap = isCombo ? MAX_COMBO_IMAGES : MAX_PRODUCT_IMAGES;
    setImageItems(
      existingUrls.slice(0, cap).map((url, idx) => ({
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
      } catch {
        toast.error('Failed to load product editor data');
        if (isEditing) navigate('/admin/products');
      } finally {
        setLoadingPage(false);
      }
    };

    loadData();
  }, [id, isEditing, navigate]);

  // When toggling unit_type, ensure conflicting fields are reset gracefully
  const handleUnitTypeChange = (next: string) => {
    setForm((prev) => {
      const goingToB = isGroupB(next);
      const goingToA = isGroupA(next);
      return {
        ...prev,
        unit_type: next,
        // Going to Group A: clear Group B-only inputs
        ...(goingToA ? { quantity_count: '1', per_unit_weight: '' } : {}),
        // Going to Group B: clear Group A-only inputs
        ...(goingToB ? { weight: '' } : {}),
      };
    });
  };

  const save = async () => {
    if (!form.name) { toast.error('Product name is required'); return; }
    if (!form.price) { toast.error('Product price is required'); return; }
    if (imageItems.length === 0) { toast.error('Please add at least one product image'); return; }
    if (!user?.id) { toast.error('User not authenticated'); return; }

    // Validate unit-specific inputs
    if (isGroupA(form.unit_type)) {
      if (!form.weight || Number(form.weight) <= 0) {
        toast.error('Please enter a weight value'); return;
      }
    } else if (isGroupB(form.unit_type)) {
      const qty = Number(form.quantity_count);
      const pu = Number(form.per_unit_weight);
      if (!qty || qty <= 0) { toast.error('Quantity count is required'); return; }
      if (!pu || pu <= 0) { toast.error('Weight per unit is required'); return; }
    }

    try {
      setIsSaving(true);

      // Compute legacy weight_kg + new calculated_shipping_weight (both in kg)
      const shippingKg = computeShippingWeightKg({
        unit_type: form.unit_type,
        weight: form.weight,
        quantity_count: Number(form.quantity_count) || 0,
        per_unit_weight: Number(form.per_unit_weight) || 0,
        per_unit_weight_unit: form.per_unit_weight_unit as 'g' | 'kg',
      });

      // Determine which existing images were removed
      const previousPaths = new Set(
        (existingProduct?.images || [])
          .map((u) => pathFromPublicUrl(u))
          .filter((p): p is string => Boolean(p))
      );
      if (existingProduct?.image_path) previousPaths.add(existingProduct.image_path);

      const keptPaths = new Set(
        imageItems.filter((i) => i.existingPath).map((i) => i.existingPath!)
      );
      const pathsToDelete = Array.from(previousPaths).filter((p) => !keptPaths.has(p));

      const newFiles = imageItems.filter((i) => i.file).map((i) => i.file!);
      const uploaded = newFiles.length > 0 ? await uploadProductImages(newFiles, user.id) : [];

      let uploadedIdx = 0;
      const finalUrls: string[] = imageItems.map((item) => {
        if (item.existingPath) return item.url;
        const result = uploaded[uploadedIdx++];
        return result.imageUrl;
      });
      const primaryUrl = finalUrls[0];
      const primaryPath = imageItems[0].existingPath || uploaded[0]?.imagePath || '';

      const payload: any = {
        name: form.name,
        description: form.description,
        short_description: form.short_description || '',
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        category_id: form.category_id || null,
        stock_quantity: Number(form.stock_quantity) || 0,
        // Universal unit fields
        unit_type: form.unit_type,
        unit: form.unit_type,                       // keep legacy `unit` in sync
        weight: isGroupA(form.unit_type) ? String(form.weight || '') : '',
        weight_kg: shippingKg,                       // legacy field stays in sync
        quantity_count: isGroupB(form.unit_type) ? Number(form.quantity_count) || 1 : null,
        per_unit_weight: isGroupB(form.unit_type) ? Number(form.per_unit_weight) || 0 : null,
        per_unit_weight_unit: isGroupB(form.unit_type) ? form.per_unit_weight_unit : 'g',
        calculated_shipping_weight: shippingKg,
        gst_percentage: Number(form.gst_percentage),
        hsn_code: form.hsn_code,
        is_available: form.is_available,
        is_featured: form.is_featured,
        is_combo: form.is_combo,
        combo_badge: form.is_combo ? (form.combo_badge || 'COMBO DEAL') : '',
        image_url: primaryUrl,
        image_path: primaryPath,
        images: finalUrls,
      };

      if (isEditing && existingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', existingProduct.id);
        if (error) throw error;
        if (pathsToDelete.length > 0) await deleteProductImagePaths(pathsToDelete);
        toast.success(form.is_combo ? 'Combo updated successfully' : 'Product updated successfully');
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success(form.is_combo ? 'Combo created successfully' : 'Product created successfully');
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
        <Card><CardContent className="pt-6"><TableSkeleton rows={8} columns={2} /></CardContent></Card>
      </div>
    );
  }

  const titleLabel = isEditing
    ? (form.is_combo ? 'Edit Combo' : 'Edit Product')
    : (form.is_combo ? 'Add Combo' : 'Add Product');

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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{titleLabel}</h1>
            {form.is_combo && (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 gap-1">
                <Sparkles className="h-3 w-3" />
                Combo
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? 'Update details and images'
              : form.is_combo
                ? `Create a combo product with up to ${MAX_COMBO_IMAGES} images`
                : `Create a new product with up to ${MAX_PRODUCT_IMAGES} images`}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {form.is_combo ? <Sparkles className="h-5 w-5 text-amber-600" /> : <Package className="h-5 w-5 text-primary" />}
            {form.is_combo ? 'Combo Details' : 'Product Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product type toggle (only when creating, locked when editing) */}
          {!isEditing && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <label className="text-sm font-medium mb-2 block">Product Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_combo: false, unit_type: 'g' })}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                    !form.is_combo ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-secondary'
                  }`}
                >
                  <Package className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                  Standard Product
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_combo: true, unit_type: 'combo', combo_badge: form.combo_badge || 'COMBO DEAL' })}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                    form.is_combo ? 'bg-amber-500 text-white border-amber-500' : 'bg-background hover:bg-secondary'
                  }`}
                >
                  <Sparkles className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                  Combo Product
                </button>
              </div>
            </div>
          )}

          {form.is_combo && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Combo Badge Text <span className="text-muted-foreground font-normal">(shown on the card)</span>
              </label>
              <Input
                placeholder="e.g. COMBO DEAL"
                value={form.combo_badge}
                onChange={e => setForm({ ...form, combo_badge: e.target.value.slice(0, 24) })}
                maxLength={24}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              {form.is_combo ? 'Combo Images' : 'Product Images'} <span className="text-muted-foreground font-normal">(up to {maxImages})</span>
            </label>
            <MultiImageUpload
              value={imageItems}
              onChange={setImageItems}
              maxImages={maxImages}
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{form.is_combo ? 'Combo Name *' : 'Product Name *'}</label>
            <Input placeholder={form.is_combo ? 'e.g. Festive Snack Combo' : 'Product name'} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
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

          <div>
            <label className="text-sm font-medium mb-2 block">Stock Quantity</label>
            <Input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
          </div>

          {/* Unit / Weight system */}
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Unit & Shipping Weight *</h4>
              <Badge variant="outline" className="text-xs font-mono">
                Ships as: {formatShipping(previewShippingKg)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Unit</label>
                <Select value={form.unit_type} onValueChange={handleUnitTypeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Direct Weight</div>
                    {GROUP_A_UNITS.map(u => <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>)}
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Count Units</div>
                    {GROUP_B_UNITS.map(u => <SelectItem key={u} value={u}>{UNIT_LABELS[u]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* GROUP A: just one weight value */}
              {isGroupA(form.unit_type) && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Weight value ({form.unit_type})
                  </label>
                  <Input
                    type="number"
                    step="any"
                    placeholder={form.unit_type === 'kg' ? 'e.g. 1' : 'e.g. 250'}
                    value={form.weight}
                    onChange={e => setForm({ ...form, weight: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* GROUP B: quantity + per-unit weight */}
            {isGroupB(form.unit_type) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantity count</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={form.quantity_count}
                    onChange={e => setForm({ ...form, quantity_count: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Weight per unit</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 5"
                    value={form.per_unit_weight}
                    onChange={e => setForm({ ...form, per_unit_weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Weight unit</label>
                  <Select
                    value={form.per_unit_weight_unit}
                    onValueChange={v => setForm({ ...form, per_unit_weight_unit: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Shipping cost is always calculated using the kilograms shown above — the display unit (
              <span className="font-medium">{form.unit_type}</span>
              ) is what customers see on the product card.
            </p>
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
              {isEditing
                ? (form.is_combo ? 'Update Combo' : 'Update Product')
                : (form.is_combo ? 'Add Combo' : 'Add Product')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

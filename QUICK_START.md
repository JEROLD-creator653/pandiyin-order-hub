# Quick Start - Image Upload System Setup

## 📋 Prerequisites
- Supabase project configured
- React app with TypeScript
- Supabase client already integrated
- `sonner` for toast notifications (already installed)

---

## 🚀 Getting Started in 5 Minutes

### Step 1: Apply Database Migration

Run this migration in your Supabase SQL editor:

```sql
-- Add image tracking to banners and products
ALTER TABLE public.banners ADD COLUMN image_path TEXT DEFAULT '';
ALTER TABLE public.banners ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.products ADD COLUMN image_path TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_banners_user_id ON public.banners(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
```

**✅ Migration applied!**

---

### Step 2: Storage Buckets

Your buckets are already created:
- `banner-images` (public)
- `product-images` (public)

**✅ Buckets ready!**

---

### Step 3: Import Components

The following files are already created in your project:

```typescript
// Upload utilities
import { 
  uploadAndSaveBanner,
  uploadAndSaveProductImage,
  deleteBanner,
  deleteProduct,
  updateBannerImage,
  updateProductImage,
  validateFile,
  ALLOWED_FORMATS,
  MAX_FILE_SIZE
} from '@/lib/imageUpload';

// UI Components
import { ImageUpload } from '@/components/ImageUpload';
import { DragDropZone } from '@/components/DragDropZone';
```

---

### Step 4: Use in Your Pages

**For Admin Banners:**

```typescript
import { ImageUpload } from '@/components/ImageUpload';
import { uploadAndSaveBanner, deleteBanner } from '@/lib/imageUpload';
import { useAuth } from '@/hooks/useAuth';

function AdminBanners() {
  const { user } = useAuth();
  
  const handleCreate = async (file: File) => {
    const banner = await uploadAndSaveBanner(
      file,
      { title: 'My Banner', is_active: true, sort_order: 0 },
      user.id
    );
  };
  
  const handleDelete = async (bannerId: string, imagePath: string) => {
    await deleteBanner(bannerId, imagePath);
  };
  
  return (
    <>
      <ImageUpload onImageSelect={handleCreate} />
      {/* ... delete button calls handleDelete ... */}
    </>
  );
}
```

**For Admin Products:**

```typescript
import { ImageUpload } from '@/components/ImageUpload';
import { uploadAndSaveProductImage, updateProductImage } from '@/lib/imageUpload';
import { useAuth } from '@/hooks/useAuth';

function AdminProducts() {
  const { user } = useAuth();
  
  const handleCreate = async (file: File) => {
    const product = await uploadAndSaveProductImage(
      file,
      { 
        name: 'Product Name',
        price: 299,
        description: 'Description'
      },
      user.id
    );
  };
  
  return <ImageUpload onImageSelect={handleCreate} />;
}
```

---

### Step 5: Display Images

Images are stored in the database with public URLs:

```typescript
// Fetch from database
const { data: banners } = await supabase
  .from('banners')
  .select('*');

// Display the image
<img src={banner.image_url} alt={banner.title} />
```

---

## 🎯 Key Functions Reference

### Upload & Save

```typescript
// Banner
await uploadAndSaveBanner(file, bannerData, userId);

// Product
await uploadAndSaveProductImage(file, productData, userId);
```

### Update Image

```typescript
// Banner with new image
await updateBannerImage(bannerId, newFile, oldImagePath, userId);

// Product with new image
await updateProductImage(productId, newFile, oldImagePath, userId);
```

### Delete (removes both DB & storage)

```typescript
// Banner
await deleteBanner(bannerId, imagePath);

// Product
await deleteProduct(productId, imagePath);
```

### Validate File

```typescript
const result = validateFile(file);
if (!result.valid) {
  console.error(result.error);
}
```

---

## 🎨 Component Props

### ImageUpload

```typescript
<ImageUpload
  onImageSelect={(file) => handleUpload(file)}  // Required
  isLoading={false}                             // Optional
  disabled={false}                              // Optional
  label="Upload Image"                          // Optional
  showPreview={true}                            // Optional
  className=""                                  // Optional
/>
```

### DragDropZone

```typescript
<DragDropZone
  onFile={(file) => handleFile(file)}           // Required
  isLoading={false}                             // Optional
  disabled={false}                              // Optional
  accept="image/*"                              // Optional
  className=""                                  // Optional
>
  <p>Drop your image here</p>
</DragDropZone>
```

---

## ✅ File Validation Rules

- **Formats:** JPG, JPEG, PNG, WEBP
- **Max Size:** 5MB
- **Min Size:** 1 byte

All validated automatically!

---

## 🔐 Security

- ✅ RLS policies enabled
- ✅ Only authenticated users can upload
- ✅ Only admins can manage images
- ✅ Public viewing enabled for customers
- ✅ File path stored for safe deletion

---

## 📱 Responsive Design

Both components are fully responsive:
- Mobile: Single column
- Tablet: Optimal spacing
- Desktop: Full featured UI

---

## 🧪 Testing

### Test Upload Flow:
1. Go to Admin Dashboard
2. Click "Add Banner" or "Add Product"
3. Drag & drop or select image
4. Fill in details
5. Click "Create"
6. See image appear in list

### Test Delete Flow:
1. Click Delete button
2. Confirm in dialog
3. Image removed from storage
4. No orphaned files

### Test Update Flow:
1. Click Edit on existing item
2. Choose "Update Image"
3. Select new image
4. Old image automatically deleted

---

## 🚨 Common Issues & Fixes

### "User not authenticated"
- Make sure user is logged in
- Check `useAuth()` hook returns user

### "Invalid file format"
- Only JPG, PNG, WEBP allowed
- Check file extension

### "File size exceeds 5MB"
- Compress image before upload
- Use online tools if needed

### "Upload failed"
- Check internet connection
- Verify Supabase credentials
- Check browser console for error

### "Image not displaying"
- Verify `image_url` in database
- Check bucket permissions
- Test URL directly in browser

---

## 📊 Storage Best Practices

1. **Organize by user:** `{userId}/{timestamp}.png`
2. **Clean up on delete:** Always delete from storage
3. **Regular audits:** Check for orphaned files
4. **Monitor quota:** Supabase has storage limits
5. **Use CDN:** (Optional) For better performance

---

## 🎉 You're All Set!

Your image upload system is ready to use!

**Next Steps:**
1. Test in your admin panel
2. Monitor uploads in Supabase Storage
3. Add more features as needed
4. Optimize with compression if needed

---

## 📞 Support

For issues or improvements:
1. Check `IMAGE_UPLOAD_GUIDE.md` for detailed docs
2. Review error messages in browser console
3. Check Supabase dashboard for logs
4. Verify RLS policies in Supabase SQL editor

/**
 * Image Upload & Storage Utility
 * Handles upload, delete, and retrieval of images from Supabase Storage
 * 
 * Supports:
 * - File validation (format & size)
 * - Drag & drop upload
 * - Progress tracking
 * - Automatic cleanup on deletion
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Constants
export const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const BUCKET_NAMES = {
  BANNERS: 'banner-images',
  PRODUCTS: 'product-images',
} as const;

// Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  imageUrl: string;
  imagePath: string;
  fileName: string;
}

export interface FileValidationError {
  valid: boolean;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): FileValidationError {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate storage path with timestamp and userId
 */
function generateStoragePath(bucketName: string, userId: string, originalFileName: string): string {
  const timestamp = Date.now();
  const extension = originalFileName.split('.').pop();
  const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;
  return `${userId}/${fileName}`;
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  bucketName: typeof BUCKET_NAMES[keyof typeof BUCKET_NAMES],
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate storage path
  const storagePath = generateStoragePath(bucketName, userId, file.name);

  try {
    // Upload to Supabase Storage with optimized cache control
    // For banners: immutable CDN cache (1 year), serves directly from CDN
    // This ensures instant loading on repeat visits
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        cacheControl: '31536000', // 1 year (31536000 seconds)
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public CDN URL
    // Supabase serves public bucket files directly via CDN
    const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

    return {
      imageUrl: data.publicUrl, // Returns: https://project.supabase.co/storage/v1/object/public/bucket/path
      imagePath: storagePath,
      fileName: file.name,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    throw new Error(message);
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(
  imagePath: string,
  bucketName: typeof BUCKET_NAMES[keyof typeof BUCKET_NAMES]
): Promise<void> {
  if (!imagePath) {
    throw new Error('Image path is required for deletion');
  }

  try {
    const { error } = await supabase.storage.from(bucketName).remove([imagePath]);

    if (error) {
      console.error('Storage deletion error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete image';
    throw new Error(message);
  }
}

/**
 * Upload and save to database (for banners)
 */
export async function uploadAndSaveBanner(
  file: File,
  bannerData: {
    title: string;
    subtitle?: string;
    link_url?: string;
    is_active?: boolean;
    sort_order?: number;
  },
  userId: string
) {
  try {
    // Upload image
    const uploadResult = await uploadImage(file, BUCKET_NAMES.BANNERS, userId);

    // Save to database
    const { data, error } = await supabase.from('banners').insert({
      ...bannerData,
      image_url: uploadResult.imageUrl,
      image_path: uploadResult.imagePath,
      user_id: userId,
    }).select().single();

    if (error) {
      // Rollback: Delete uploaded image if DB save fails
      await deleteImage(uploadResult.imagePath, BUCKET_NAMES.BANNERS).catch(() => {
        console.error('Rollback: Could not delete uploaded image');
      });
      throw new Error(`Failed to save banner: ${error.message}`);
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Banner upload failed';
    throw new Error(message);
  }
}

/**
 * Upload and save to database (for products)
 */
export async function uploadAndSaveProductImage(
  file: File,
  productData: {
    name: string;
    description?: string;
    price: number;
    category_id?: string;
    stock_quantity?: number;
  },
  userId: string
) {
  try {
    // Upload image
    const uploadResult = await uploadImage(file, BUCKET_NAMES.PRODUCTS, userId);

    // Save to database
    const { data, error } = await supabase.from('products').insert({
      ...productData,
      image_url: uploadResult.imageUrl,
      image_path: uploadResult.imagePath,
      user_id: userId,
    }).select().single();

    if (error) {
      // Rollback: Delete uploaded image if DB save fails
      await deleteImage(uploadResult.imagePath, BUCKET_NAMES.PRODUCTS).catch(() => {
        console.error('Rollback: Could not delete uploaded image');
      });
      throw new Error(`Failed to save product: ${error.message}`);
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Product upload failed';
    throw new Error(message);
  }
}

/**
 * Delete banner and associated image
 */
export async function deleteBanner(bannerID: string, imagePath: string) {
  try {
    // Delete from database first
    const { error: dbError } = await supabase.from('banners').delete().eq('id', bannerID);

    if (dbError) {
      throw new Error(`Failed to delete banner record: ${dbError.message}`);
    }

    // Delete image from storage
    if (imagePath) {
      await deleteImage(imagePath, BUCKET_NAMES.BANNERS);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete banner';
    throw new Error(message);
  }
}

/**
 * Delete product and associated image
 */
export async function deleteProduct(productID: string, imagePath: string) {
  try {
    // Delete from database first
    const { error: dbError } = await supabase.from('products').delete().eq('id', productID);

    if (dbError) {
      throw new Error(`Failed to delete product record: ${dbError.message}`);
    }

    // Delete image from storage
    if (imagePath) {
      await deleteImage(imagePath, BUCKET_NAMES.PRODUCTS);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    throw new Error(message);
  }
}

/**
 * Update banner image (delete old, upload new)
 */
export async function updateBannerImage(
  bannerId: string,
  file: File,
  oldImagePath: string,
  userId: string
) {
  let newUploadResult: UploadResult | null = null;

  try {
    // Upload new image
    newUploadResult = await uploadImage(file, BUCKET_NAMES.BANNERS, userId);

    // Update database
    const { data, error } = await supabase
      .from('banners')
      .update({
        image_url: newUploadResult.imageUrl,
        image_path: newUploadResult.imagePath,
      })
      .eq('id', bannerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update banner: ${error.message}`);
    }

    // Delete old image after successful DB update
    if (oldImagePath) {
      await deleteImage(oldImagePath, BUCKET_NAMES.BANNERS).catch(() => {
        console.error('Could not delete old banner image');
      });
    }

    return data;
  } catch (error) {
    // Rollback: Delete new image if update fails
    if (newUploadResult) {
      await deleteImage(newUploadResult.imagePath, BUCKET_NAMES.BANNERS).catch(() => {
        console.error('Rollback: Could not delete new image');
      });
    }
    const message = error instanceof Error ? error.message : 'Banner image update failed';
    throw new Error(message);
  }
}

/**
 * Update product image (delete old, upload new)
 */
export async function updateProductImage(
  productId: string,
  file: File,
  oldImagePath: string,
  userId: string
) {
  let newUploadResult: UploadResult | null = null;

  try {
    // Upload new image
    newUploadResult = await uploadImage(file, BUCKET_NAMES.PRODUCTS, userId);

    // Update database
    const { data, error } = await supabase
      .from('products')
      .update({
        image_url: newUploadResult.imageUrl,
        image_path: newUploadResult.imagePath,
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    // Delete old image after successful DB update
    if (oldImagePath) {
      await deleteImage(oldImagePath, BUCKET_NAMES.PRODUCTS).catch(() => {
        console.error('Could not delete old product image');
      });
    }

    return data;
  } catch (error) {
    // Rollback: Delete new image if update fails
    if (newUploadResult) {
      await deleteImage(newUploadResult.imagePath, BUCKET_NAMES.PRODUCTS).catch(() => {
        console.error('Rollback: Could not delete new image');
      });
    }
    const message = error instanceof Error ? error.message : 'Product image update failed';
    throw new Error(message);
  }
}

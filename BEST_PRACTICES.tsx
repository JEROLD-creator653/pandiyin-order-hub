/**
 * Best Practices & Common Patterns
 * Ready-to-use code snippets for your project
 */

// ============================================
// Pattern 1: Hook for Upload Management
// ============================================

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  uploadAndSaveBanner,
  uploadAndSaveProductImage,
  updateBannerImage,
  updateProductImage,
  deleteBanner,
  deleteProduct,
  validateFile,
} from '@/lib/imageUpload';

interface UseImageUploadOptions {
  userId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook for managing image uploads in your components
 */
export function useImageUpload({
  userId,
  onSuccess,
  onError,
}: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadBanner = useCallback(
    async (
      file: File,
      bannerData: {
        title: string;
        subtitle?: string;
        link_url?: string;
        is_active?: boolean;
        sort_order?: number;
      }
    ) => {
      try {
        setIsUploading(true);
        const validation = validateFile(file);
        
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        const banner = await uploadAndSaveBanner(file, bannerData, userId);
        toast.success('Banner uploaded successfully');
        onSuccess?.();
        return banner;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        toast.error(message);
        onError?.(message);
        throw error;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [userId, onSuccess, onError]
  );

  const uploadProduct = useCallback(
    async (
      file: File,
      productData: {
        name: string;
        description?: string;
        price: number;
        category_id?: string;
      }
    ) => {
      try {
        setIsUploading(true);
        const validation = validateFile(file);
        
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        const product = await uploadAndSaveProductImage(
          file,
          productData,
          userId
        );
        toast.success('Product created successfully');
        onSuccess?.();
        return product;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        toast.error(message);
        onError?.(message);
        throw error;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [userId, onSuccess, onError]
  );

  const updateBanner = useCallback(
    async (bannerId: string, file: File, oldImagePath: string) => {
      try {
        setIsUploading(true);
        const banner = await updateBannerImage(
          bannerId,
          file,
          oldImagePath,
          userId
        );
        toast.success('Banner updated successfully');
        onSuccess?.();
        return banner;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Update failed';
        toast.error(message);
        onError?.(message);
        throw error;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [userId, onSuccess, onError]
  );

  const updateProduct = useCallback(
    async (productId: string, file: File, oldImagePath: string) => {
      try {
        setIsUploading(true);
        const product = await updateProductImage(
          productId,
          file,
          oldImagePath,
          userId
        );
        toast.success('Product updated successfully');
        onSuccess?.();
        return product;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Update failed';
        toast.error(message);
        onError?.(message);
        throw error;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [userId, onSuccess, onError]
  );

  const removeItem = useCallback(
    async (id: string, imagePath: string, type: 'banner' | 'product') => {
      try {
        setIsUploading(true);
        if (type === 'banner') {
          await deleteBanner(id, imagePath);
        } else {
          await deleteProduct(id, imagePath);
        }
        toast.success('Item deleted successfully');
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Delete failed';
        toast.error(message);
        onError?.(message);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess, onError]
  );

  return {
    isUploading,
    progress,
    uploadBanner,
    uploadProduct,
    updateBanner,
    updateProduct,
    removeItem,
  };
}

// Usage:
// const { isUploading, uploadBanner } = useImageUpload({ userId, onSuccess: refresh });
// <ImageUpload onImageSelect={(file) => uploadBanner(file, { title: 'Test' })} />

// ============================================
// Pattern 2: Image Optimization Helper
// ============================================

/**
 * Compress image before upload for faster performance
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File(
              [blob!],
              file.name,
              { type: 'image/webp' }
            );
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

// Usage:
// const compressed = await compressImage(file);
// await uploadAndSaveBanner(compressed, data, userId);

// ============================================
// Pattern 3: Batch Upload Manager
// ============================================

interface BatchUploadTask {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function useBatchUpload(userId: string) {
  const [tasks, setTasks] = useState<BatchUploadTask[]>([]);

  const addTask = useCallback((file: File) => {
    const id = Math.random().toString(36).substring(7);
    setTasks((prev) => [
      ...prev,
      {
        id,
        file,
        status: 'pending' as const,
        progress: 0,
      },
    ]);
    return id;
  }, []);

  const processTasks = useCallback(async () => {
    for (const task of tasks.filter((t) => t.status === 'pending')) {
      try {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'uploading' as const } : t
          )
        );

        await uploadAndSaveProductImage(
          task.file,
          {
            name: task.file.name,
            price: 0,
            description: 'Uploaded via batch',
          },
          userId
        );

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: 'success' as const, progress: 100 }
              : t
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: 'error' as const, error: message }
              : t
          )
        );
      }
    }
  }, [tasks, userId]);

  return { tasks, addTask, processTasks };
}

// ============================================
// Pattern 4: Image Validation with Aspect Ratio
// ============================================

interface AspectRatioValidation {
  file: File;
  minRatio?: number;
  maxRatio?: number;
}

export async function validateImageAspectRatio({
  file,
  minRatio = 0.5,
  maxRatio = 2.0,
}: AspectRatioValidation): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;

        if (ratio < minRatio || ratio > maxRatio) {
          resolve({
            valid: false,
            error: `Image aspect ratio must be between ${minRatio}:1 and ${maxRatio}:1`,
          });
        } else {
          resolve({ valid: true });
        }
      };
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

// Usage:
// const validation = await validateImageAspectRatio({ file, minRatio: 1, maxRatio: 1.5 });

// ============================================
// Pattern 5: Automatic Retry on Upload Failure
// ============================================

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

export async function uploadImageWithRetry(
  file: File,
  bucketName: string,
  userId: string,
  options: RetryOptions = {}
) {
  const { maxAttempts = 3, delayMs = 1000 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxAttempts}`);

      const result = await uploadImage(file, bucketName, userId);
      console.log('Upload succeeded on attempt', attempt);
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === maxAttempts) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

// Usage:
// const result = await uploadImageWithRetry(file, bucketName, userId, { maxAttempts: 5 });

// ============================================
// Pattern 6: Progress Tracking with Events
// ============================================

type UploadProgressCallback = (progress: {
  loaded: number;
  total: number;
  percentage: number;
}) => void;

export class UploadProgressEmitter {
  private callbacks: UploadProgressCallback[] = [];

  on(callback: UploadProgressCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((c) => c !== callback);
    };
  }

  emit(loaded: number, total: number) {
    const percentage = Math.round((loaded / total) * 100);
    this.callbacks.forEach((cb) => cb({ loaded, total, percentage }));
  }

  clear() {
    this.callbacks = [];
  }
}

// Usage:
// const emitter = new UploadProgressEmitter();
// emitter.on(({ percentage }) => setProgress(percentage));

// ============================================
// Pattern 7: Caching Downloaded Images
// ============================================

class ImageCache {
  private cache = new Map<string, string>();
  private pendingLoads = new Map<string, Promise<string>>();

  async getImage(url: string): Promise<string> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Check if already loading
    if (this.pendingLoads.has(url)) {
      return this.pendingLoads.get(url)!;
    }

    // Load new
    const promise = fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const dataUrl = URL.createObjectURL(blob);
        this.cache.set(url, dataUrl);
        return dataUrl;
      });

    this.pendingLoads.set(url, promise);
    try {
      return await promise;
    } finally {
      this.pendingLoads.delete(url);
    }
  }

  clear() {
    this.cache.forEach((url) => URL.revokeObjectURL(url));
    this.cache.clear();
    this.pendingLoads.clear();
  }
}

export const imageCache = new ImageCache();

// Usage:
// const cachedUrl = await imageCache.getImage(product.image_url);

// ============================================
// Pattern 8: Error Recovery
// ============================================

/**
 * Attempt to detect orphaned images and clean them up
 * Call daily or on demand
 */
export async function cleanupOrphanedImages(userId: string) {
  try {
    // Get all banners
    const { data: banners } = await supabase
      .from('banners')
      .select('image_path');

    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('image_path');

    const validPaths = new Set([
      ...(banners?.map((b) => b.image_path) || []),
      ...(products?.map((p) => p.image_path) || []),
    ]);

    // List all files in storage
    const { data: files } = await supabase.storage
      .from('product-images')
      .list(userId);

    // Delete orphaned files
    const orphaned = (files || []).filter(
      (f) => f.name && !validPaths.has(`${userId}/${f.name}`)
    );

    if (orphaned.length > 0) {
      await supabase.storage
        .from('product-images')
        .remove(orphaned.map((f) => `${userId}/${f.name}`));

      console.log(`Cleaned up ${orphaned.length} orphaned images`);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// ============================================
// Pattern 9: Upload with Metadata
// ============================================

interface ImageMetadata {
  caption?: string;
  alt?: string;
  tags?: string[];
  uploadedAt?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export async function uploadImageWithMetadata(
  file: File,
  metadata: ImageMetadata,
  bucketName: string,
  userId: string
) {
  // Create metadata file
  const metadataFile = new File(
    [JSON.stringify(metadata)],
    `${file.name}.meta.json`,
    { type: 'application/json' }
  );

  // Upload both files
  const [imageResult] = await Promise.all([
    uploadImage(file, bucketName, userId),
    // Upload metadata separately
    supabase.storage
      .from(bucketName)
      .upload(`${userId}/${file.name}.meta.json`, metadataFile),
  ]);

  return imageResult;
}

// ============================================
// Pattern 10: Safe Batch Delete
// ============================================

export async function safeBatchDelete(
  items: Array<{ id: string; image_path: string; type: 'banner' | 'product' }>
) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const item of items) {
    try {
      if (item.type === 'banner') {
        await deleteBanner(item.id, item.image_path);
      } else {
        await deleteProduct(item.id, item.image_path);
      }
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        error instanceof Error ? error.message : `Delete failed for ${item.id}`
      );
    }
  }

  return results;
}

// Usage:
// const result = await safeBatchDelete([
//   { id: '1', image_path: 'path/to/image', type: 'banner' },
//   { id: '2', image_path: 'path/to/image', type: 'product' }
// ]);

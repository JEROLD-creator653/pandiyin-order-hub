/**
 * Review image upload utility
 * Handles WebP-converted customer review photo uploads to a public Supabase bucket.
 */

import { supabase } from '@/integrations/supabase/client';
import { convertImageToWebP } from './webpConverter';

export const REVIEW_IMAGES_BUCKET = 'review-images';
export const MAX_REVIEW_IMAGES = 5;
export const MAX_REVIEW_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB pre-conversion

const ALLOWED_REVIEW_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export function validateReviewImage(file: File): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'No file selected' };
  if (file.size > MAX_REVIEW_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image must be under 5MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }
  if (!ALLOWED_REVIEW_FORMATS.includes(file.type) && !file.type.startsWith('image/')) {
    return { valid: false, error: 'Only image files are allowed' };
  }
  return { valid: true };
}

/**
 * Upload a single review image after WebP conversion.
 * Returns the public CDN URL.
 */
export async function uploadReviewImage(file: File, userId: string): Promise<string> {
  const validation = validateReviewImage(file);
  if (!validation.valid) throw new Error(validation.error);

  // Convert to WebP for storage efficiency
  const webpFile = await convertImageToWebP(file, {
    quality: 0.8,
    maxWidth: 1280,
    maxHeight: 1280,
  });

  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
  const storagePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(REVIEW_IMAGES_BUCKET)
    .upload(storagePath, webpFile, {
      cacheControl: '31536000',
      upsert: false,
      contentType: 'image/webp',
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Upload multiple review images in parallel.
 */
export async function uploadReviewImages(files: File[], userId: string): Promise<string[]> {
  const trimmed = files.slice(0, MAX_REVIEW_IMAGES);
  const uploads = await Promise.allSettled(trimmed.map((f) => uploadReviewImage(f, userId)));
  return uploads
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map((r) => r.value);
}

/**
 * Extract storage path from a Supabase public URL for a given bucket.
 * Used for cleanup on deletion.
 */
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(publicUrl.substring(idx + marker.length));
  } catch {
    return null;
  }
}

/**
 * Delete review images from storage by their public URLs.
 * Silently ignores failures (cleanup is best-effort).
 */
export async function deleteReviewImages(urls: string[]): Promise<void> {
  const paths = urls
    .map((u) => extractStoragePath(u, REVIEW_IMAGES_BUCKET))
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  await supabase.storage.from(REVIEW_IMAGES_BUCKET).remove(paths).then(() => {}).catch(() => {});
}

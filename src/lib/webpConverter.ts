/**
 * Client-side WebP image converter
 * Converts uploaded images to WebP format to save storage and bandwidth.
 * Falls back gracefully if WebP encoding is unsupported.
 */

interface ConvertOptions {
  quality?: number; // 0-1, default 0.82
  maxWidth?: number; // default 1600
  maxHeight?: number; // default 1600
}

/**
 * Convert any image File to a WebP File using canvas.
 * Preserves aspect ratio while constraining max dimensions.
 */
export async function convertImageToWebP(
  file: File,
  options: ConvertOptions = {}
): Promise<File> {
  const { quality = 0.82, maxWidth = 1600, maxHeight = 1600 } = options;

  // Already WebP — only resize if oversized, else pass through
  if (file.type === 'image/webp' && file.size < 800 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        try {
          // Compute target dimensions preserving aspect ratio
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');

          // White background flatten for transparent PNGs to keep file small
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Browser refused WebP encoding — fallback to original
                resolve(file);
                return;
              }
              const baseName = file.name.replace(/\.[^.]+$/, '');
              const webpFile = new File([blob], `${baseName}.webp`, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(webpFile);
            },
            'image/webp',
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Batch convert multiple images to WebP.
 * Returns successfully converted files; logs (does not throw) per-file failures.
 */
export async function convertImagesToWebP(
  files: File[],
  options?: ConvertOptions
): Promise<File[]> {
  const results = await Promise.allSettled(files.map((f) => convertImageToWebP(f, options)));
  return results
    .filter((r): r is PromiseFulfilledResult<File> => r.status === 'fulfilled')
    .map((r) => r.value);
}

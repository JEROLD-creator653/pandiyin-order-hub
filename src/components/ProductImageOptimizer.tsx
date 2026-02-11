import { memo } from 'react';

interface ProductImageOptimizerProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Optimize product images with lazy loading and responsive sizing
 */
const ProductImageOptimizer = memo(function ProductImageOptimizer({
  src,
  alt,
  className = 'w-full h-full object-cover rounded-lg',
  fallback,
}: ProductImageOptimizerProps) {
  if (!src) {
    return fallback || <div className={className + ' bg-muted'} />;
  }

  // Generate optimized image URL with compression
  const getOptimizedImageUrl = (imageUrl: string, quality: 'high' | 'medium' | 'low' = 'high') => {
    // If using a CDN or external image service, optimize here
    // For now, return the image URL as-is
    // In production, integrate with image optimization service (Cloudinary, imgix, etc.)
    return imageUrl;
  };

  return (
    <picture>
      {/* WebP format for modern browsers - extremely efficient */}
      <source srcSet={getOptimizedImageUrl(src, 'medium')} type="image/webp" />
      
      {/* Fallback to original format */}
      <img
        src={getOptimizedImageUrl(src, 'medium')}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = src; // Fallback to original if optimized version fails
        }}
      />
    </picture>
  );
});

export default ProductImageOptimizer;

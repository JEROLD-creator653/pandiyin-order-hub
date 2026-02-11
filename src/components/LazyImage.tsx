import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholderClassName?: string;
  onLoad?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholderClassName = 'aspect-square',
  onLoad,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start loading the image
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  const handleLoadComplete = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div className="relative overflow-hidden bg-muted" ref={imgRef}>
      {!isLoaded && <Skeleton className={placeholderClassName} />}

      {imageSrc && (
        <>
          {/* WebP version - modern browsers */}
          <picture>
            <source srcSet={`${imageSrc}?format=webp`} type="image/webp" />
            <img
              src={imageSrc}
              alt={alt}
              className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              width={width}
              height={height}
              loading="lazy"
              onLoad={handleLoadComplete}
              onError={() => setIsLoaded(true)}
            />
          </picture>
        </>
      )}
    </div>
  );
}

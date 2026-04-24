/**
 * Amazon/Flipkart-style product image gallery.
 * - Desktop: vertical thumbnail strip on the left, large main image on the right
 * - Mobile: swipeable carousel with dot indicators
 * - Click thumbnail to switch main image
 * - Click main image to open lightbox/zoom
 */

import { useState, useEffect, useRef } from 'react';
import { Leaf, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

export default function ProductImageGallery({
  images,
  productName,
  className,
}: ProductImageGalleryProps) {
  const validImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Reset to first image if list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [images.join('|')]);

  const goPrev = () => setActiveIndex((i) => (i === 0 ? validImages.length - 1 : i - 1));
  const goNext = () => setActiveIndex((i) => (i === validImages.length - 1 ? 0 : i + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext();
      else goPrev();
    }
  };

  // Keyboard nav inside lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, validImages.length]);

  if (validImages.length === 0) {
    return (
      <div
        className={cn(
          'sticky top-28 rounded-2xl overflow-hidden border border-muted bg-muted h-[320px] md:h-[520px] w-full flex items-center justify-center',
          className
        )}
      >
        <Leaf className="h-24 w-24 text-muted-foreground/40" />
      </div>
    );
  }

  const activeImage = validImages[activeIndex];

  return (
    <>
      <div className={cn('lg:sticky lg:top-28', className)}>
        <div className="flex flex-col-reverse md:flex-row gap-3">
          {/* Thumbnail strip - horizontal on mobile, vertical on desktop */}
          {validImages.length > 1 && (
            <div className="flex md:flex-col gap-2 md:gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[520px] no-scrollbar md:pr-1">
              {validImages.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    'flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                    'h-16 w-16 md:h-20 md:w-20',
                    activeIndex === idx
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-muted hover:border-muted-foreground/40'
                  )}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt={`${productName} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main image with swipe + nav arrows */}
          <div
            className="relative flex-1 rounded-2xl overflow-hidden border border-muted shadow-sm bg-muted h-[320px] md:h-[520px] group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={activeImage}
              alt={`${productName} - image ${activeIndex + 1}`}
              className="w-full h-full object-contain block cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            />

            {/* Zoom hint icon - desktop only on hover */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="hidden md:flex absolute top-3 right-3 bg-background/90 hover:bg-background rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Zoom image"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            {/* Nav arrows - shown when multiple images */}
            {validImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background rounded-full p-2 shadow-md transition-opacity md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background rounded-full p-2 shadow-md transition-opacity md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Dot indicators - mobile only */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                  {validImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={cn(
                        'rounded-full transition-all',
                        activeIndex === idx
                          ? 'w-6 h-2 bg-primary'
                          : 'w-2 h-2 bg-background/70'
                      )}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Counter - top-left */}
                <div className="absolute top-3 left-3 bg-background/90 text-foreground rounded-full px-2.5 py-1 text-xs font-medium shadow-sm">
                  {activeIndex + 1} / {validImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={activeImage}
            alt={`${productName} - enlarged`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {validImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                {activeIndex + 1} / {validImages.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

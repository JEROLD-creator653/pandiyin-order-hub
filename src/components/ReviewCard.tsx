import { useState } from 'react';
import { MoreVertical, Trash2, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react';
import RatingStars from './RatingStars';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  description: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  images?: string[] | null;
}

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onDelete?: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  className?: string;
}

export default function ReviewCard({
  review,
  currentUserId,
  onDelete,
  onEdit,
  className,
}: ReviewCardProps) {
  const isOwnReview = currentUserId === review.user_id;
  const images = (review.images || []).filter(Boolean);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const getInitials = () => {
    if (review.user_name) {
      return review.user_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (review.user_email) {
      return review.user_email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (review.user_name) return review.user_name;
    if (review.user_email) {
      const emailParts = review.user_email.split('@');
      return emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
    }
    return 'Anonymous User';
  };

  const goPrev = () =>
    setLightboxIndex((i) => (i === null ? null : i === 0 ? images.length - 1 : i - 1));
  const goNext = () =>
    setLightboxIndex((i) => (i === null ? null : i === images.length - 1 ? 0 : i + 1));

  return (
    <>
      <div className={cn('border-b pb-6 last:border-b-0', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-medium">{getDisplayName()}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <RatingStars rating={review.rating} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {review.description}
              </p>

              {/* Review Images */}
              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className="rounded-lg overflow-hidden border bg-muted hover:opacity-90 transition-opacity h-20 w-20 sm:h-24 sm:w-24"
                      aria-label={`View review photo ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Review photo ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isOwnReview && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(review.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Review
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(review.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Lightbox for review images */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={images[lightboxIndex]}
            alt={`Review photo ${lightboxIndex + 1} enlarged`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
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
                {lightboxIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

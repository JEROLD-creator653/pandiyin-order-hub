import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Shield, MoreVertical, Trash2, Edit } from 'lucide-react';
import RatingStars from './RatingStars';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
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
  title: string;
  review_text: string;
  helpful_count: number;
  verified_purchase: boolean;
  images?: string[];
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_vote?: 'helpful' | 'not_helpful' | null;
}

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onVote?: (reviewId: string, isHelpful: boolean) => void;
  onDelete?: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  className?: string;
}

export default function ReviewCard({
  review,
  currentUserId,
  onVote,
  onDelete,
  onEdit,
  className
}: ReviewCardProps) {
  const [imageExpanded, setImageExpanded] = useState<string | null>(null);
  const isOwnReview = currentUserId === review.user_id;

  // Get initials from email or user name
  const getInitials = () => {
    if (review.user_name) {
      return review.user_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (review.user_email) {
      return review.user_email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    if (review.user_name) return review.user_name;
    if (review.user_email) {
      const emailParts = review.user_email.split('@');
      return emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
    }
    return 'Anonymous User';
  };

  const handleVote = (isHelpful: boolean) => {
    if (onVote && currentUserId) {
      onVote(review.id, isHelpful);
    }
  };

  return (
    <div className={cn('border-b pb-6 last:border-b-0', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 flex-1">
          {/* User Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* User Info and Rating */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-medium">{getDisplayName()}</span>
              {review.verified_purchase && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Shield className="h-3 w-3" />
                  Verified Purchase
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <RatingStars rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Review Content */}
            <h4 className="font-semibold mb-1">{review.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {review.review_text}
            </p>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {review.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setImageExpanded(image)}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Helpful Votes */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">
                Was this helpful?
              </span>
              <div className="flex gap-1">
                <Button
                  variant={review.user_vote === 'helpful' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVote(true)}
                  disabled={!currentUserId || isOwnReview}
                  className="gap-1"
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>{review.helpful_count > 0 && review.helpful_count}</span>
                </Button>
                <Button
                  variant={review.user_vote === 'not_helpful' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVote(false)}
                  disabled={!currentUserId || isOwnReview}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Menu (for own review) */}
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
                <DropdownMenuItem
                  onClick={() => onDelete(review.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Review
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Expanded Image Modal */}
      {imageExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImageExpanded(null)}
        >
          <img
            src={imageExpanded}
            alt="Expanded review"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

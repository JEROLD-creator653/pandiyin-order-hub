import { MoreVertical, Trash2, Edit } from 'lucide-react';
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
  className
}: ReviewCardProps) {
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
            </div>

            <div className="flex items-center gap-2 mb-2">
              <RatingStars rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Review Content */}
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {review.description}
            </p>
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
    </div>
  );
}

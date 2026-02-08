import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

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

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  currentUserId?: string;
  selectedRating?: number | null;
  sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  onVote?: (reviewId: string, isHelpful: boolean) => void;
  onDelete?: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  onSortChange?: (sort: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export default function ReviewList({
  reviews,
  loading = false,
  currentUserId,
  selectedRating,
  sortBy = 'recent',
  onVote,
  onDelete,
  onEdit,
  onSortChange,
  onLoadMore,
  hasMore = false,
  className
}: ReviewListProps) {
  const [sortValue, setSortValue] = useState(sortBy);

  const handleSortChange = (value: string) => {
    setSortValue(value as any);
    onSortChange?.(value);
  };

  if (loading && reviews.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 pb-6 border-b">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && reviews.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-muted-foreground">
          {selectedRating 
            ? `No ${selectedRating}-star reviews found` 
            : 'No reviews yet'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedRating 
            ? 'Try selecting a different rating filter' 
            : 'Be the first to review this product'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Sort and Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
          </span>
          {selectedRating && (
            <span className="text-sm text-muted-foreground">
              ({selectedRating} stars)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
              <SelectItem value="rating_high">Highest Rating</SelectItem>
              <SelectItem value="rating_low">Lowest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            onVote={onVote}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              'Loading...'
            ) : (
              <>
                Load More Reviews
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

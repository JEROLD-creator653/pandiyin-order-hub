import { Star } from 'lucide-react';
import RatingStars from './RatingStars';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  verified_purchases?: number;
}

interface ReviewSummaryProps {
  stats: ReviewStats | null;
  onFilterByRating?: (rating: number | null) => void;
  selectedRating?: number | null;
  className?: string;
}

export default function ReviewSummary({
  stats,
  onFilterByRating,
  selectedRating,
  className
}: ReviewSummaryProps) {
  if (!stats || stats.total_reviews === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">No reviews yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Be the first to review this product
        </p>
      </div>
    );
  }

  const ratingBreakdown = [
    { stars: 5, count: stats.five_star },
    { stars: 4, count: stats.four_star },
    { stars: 3, count: stats.three_star },
    { stars: 2, count: stats.two_star },
    { stars: 1, count: stats.one_star }
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Rating */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center pb-4 border-b">
        <div className="text-center sm:text-left">
          <div className="text-5xl font-bold mb-2">
            {stats.average_rating.toFixed(1)}
          </div>
          <RatingStars rating={stats.average_rating} size="lg" />
          <p className="text-sm text-muted-foreground mt-2">
            Based on {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
          </p>
          {stats.verified_purchases !== undefined && stats.verified_purchases > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {stats.verified_purchases} verified purchase{stats.verified_purchases !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2 w-full sm:w-auto">
          {ratingBreakdown.map(({ stars, count }) => {
            const percentage = stats.total_reviews > 0 
              ? (count / stats.total_reviews) * 100 
              : 0;
            const isSelected = selectedRating === stars;

            return (
              <button
                key={stars}
                onClick={() => onFilterByRating?.(isSelected ? null : stars)}
                className={cn(
                  'flex items-center gap-3 w-full group hover:bg-muted/50 p-2 rounded-md transition-colors',
                  isSelected && 'bg-muted'
                )}
                disabled={!onFilterByRating}
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  {stars} <Star className="inline h-3 w-3" />
                </span>
                <Progress 
                  value={percentage} 
                  className="flex-1 h-2"
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

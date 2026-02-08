import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function RatingInput({
  value,
  onChange,
  maxRating = 5,
  size = 'lg',
  disabled = false,
  className
}: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const displayRating = hoverRating || value;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;

        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(starValue)}
            onMouseEnter={() => !disabled && setHoverRating(starValue)}
            onMouseLeave={() => !disabled && setHoverRating(0)}
            className={cn(
              'transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50',
              !disabled && 'cursor-pointer'
            )}
            aria-label={`Rate ${starValue} out of ${maxRating} stars`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled ? 'text-yellow-500' : 'text-muted-foreground/30',
                'transition-colors'
              )}
              fill={isFilled ? 'currentColor' : 'none'}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value} out of {maxRating}
        </span>
      )}
    </div>
  );
}

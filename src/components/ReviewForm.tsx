import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import RatingInput from './RatingInput';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  productId: string;
  productName?: string;
  existingReview?: {
    id: string;
    rating: number;
    description: string;
  };
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export interface ReviewFormData {
  rating: number;
  description: string;
}

export default function ReviewForm({
  productId,
  productName,
  existingReview,
  onSubmit,
  onCancel,
  className
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [description, setDescription] = useState(existingReview?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (!description.trim()) {
      newErrors.description = 'Please enter your review';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Review must be at least 20 characters';
    } else if (description.length > 2000) {
      newErrors.description = 'Review must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        description: description.trim()
      });
      
      // Reset form if not editing
      if (!existingReview) {
        setRating(0);
        setDescription('');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn('p-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {existingReview ? 'Edit Your Review' : 'Write a Review'}
            </h3>
            {productName && (
              <p className="text-sm text-muted-foreground mt-1">
                For: {productName}
              </p>
            )}
          </div>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Rating Input */}
        <div className="space-y-2">
          <Label htmlFor="rating">
            Your Rating <span className="text-destructive">*</span>
          </Label>
          <RatingInput
            value={rating}
            onChange={setRating}
            disabled={isSubmitting}
          />
          {errors.rating && (
            <p className="text-sm text-destructive">{errors.rating}</p>
          )}
        </div>

        {/* Review Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Review Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Share your experience with this product..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            rows={6}
            maxLength={2000}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{errors.description || 'Minimum 20 characters'}</span>
            <span>{description.length}/2000</span>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : existingReview ? (
              'Update Review'
            ) : (
              'Submit Review'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

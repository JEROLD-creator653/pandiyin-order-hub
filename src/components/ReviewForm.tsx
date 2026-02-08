import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import RatingInput from './RatingInput';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
    title: string;
    review_text: string;
    images?: string[];
  };
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export interface ReviewFormData {
  rating: number;
  title: string;
  review_text: string;
  images?: string[];
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
  const [title, setTitle] = useState(existingReview?.title || '');
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [images, setImages] = useState<string[]>(existingReview?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (!title.trim()) {
      newErrors.title = 'Please enter a title';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    if (!reviewText.trim()) {
      newErrors.review_text = 'Please enter your review';
    } else if (reviewText.length < 20) {
      newErrors.review_text = 'Review must be at least 20 characters';
    } else if (reviewText.length > 2000) {
      newErrors.review_text = 'Review must be less than 2000 characters';
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
        title: title.trim(),
        review_text: reviewText.trim(),
        images
      });
      
      // Reset form if not editing
      if (!existingReview) {
        setRating(0);
        setTitle('');
        setReviewText('');
        setImages([]);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real implementation, you would upload these to storage
    // For now, we'll create object URLs
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Review Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Sum up your experience in one line"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            maxLength={100}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{errors.title || 'Brief and descriptive'}</span>
            <span>{title.length}/100</span>
          </div>
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label htmlFor="review_text">
            Your Review <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="review_text"
            placeholder="Share your experience with this product..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            disabled={isSubmitting}
            rows={6}
            maxLength={2000}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{errors.review_text || 'Minimum 20 characters'}</span>
            <span>{reviewText.length}/2000</span>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Add Photos (Optional)</Label>
          <div className="space-y-3">
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 5 && (
              <div>
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Upload up to {5 - images.length} more {images.length < 4 ? 'photos' : 'photo'}
                  </span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </div>
            )}
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

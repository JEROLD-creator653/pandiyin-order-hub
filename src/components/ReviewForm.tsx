import { useState, useRef } from 'react';
import { X, Loader2, ImagePlus, Camera } from 'lucide-react';
import RatingInput from './RatingInput';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { validateReviewImage, MAX_REVIEW_IMAGES } from '@/lib/reviewImageUpload';
import { toast } from 'sonner';

interface ReviewImageItem {
  id: string;
  url: string; // object URL for new files, https URL for existing
  file?: File; // present for newly added files
}

interface ReviewFormProps {
  productId: string;
  productName?: string;
  existingReview?: {
    id: string;
    rating: number;
    description: string;
    images?: string[];
  };
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export interface ReviewFormData {
  rating: number;
  description: string;
  newImageFiles: File[]; // newly added files (need WebP conversion + upload)
  keptImageUrls: string[]; // existing image URLs the user kept
}

const countCharacters = (value: string) => Array.from(value).length;

export default function ReviewForm({
  productId,
  productName,
  existingReview,
  onSubmit,
  onCancel,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [description, setDescription] = useState(existingReview?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageItems, setImageItems] = useState<ReviewImageItem[]>(() =>
    (existingReview?.images || []).map((url, idx) => ({
      id: `existing_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      url,
    }))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const remaining = MAX_REVIEW_IMAGES - imageItems.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_REVIEW_IMAGES} photos per review`);
      return;
    }
    const accepted = list.slice(0, remaining);
    const newItems: ReviewImageItem[] = [];
    for (const file of accepted) {
      const validation = validateReviewImage(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid image');
        continue;
      }
      newItems.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        url: URL.createObjectURL(file),
        file,
      });
    }
    if (newItems.length > 0) {
      setImageItems((prev) => [...prev, ...newItems]);
    }
    if (list.length > remaining) {
      toast.warning(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added`);
    }
  };

  const handleRemoveImage = (id: string) => {
    const item = imageItems.find((i) => i.id === id);
    if (item?.file) URL.revokeObjectURL(item.url);
    setImageItems((prev) => prev.filter((i) => i.id !== id));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const trimmedDescription = description.trim();
    const descriptionLength = countCharacters(trimmedDescription);

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (!trimmedDescription) {
      newErrors.description = 'Please enter your review';
    } else if (descriptionLength < 20) {
      newErrors.description = 'Review must be at least 20 characters';
    } else if (descriptionLength > 2000) {
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
      const newImageFiles = imageItems.filter((i) => i.file).map((i) => i.file!);
      const keptImageUrls = imageItems.filter((i) => !i.file).map((i) => i.url);

      await onSubmit({
        rating,
        description: description.trim(),
        newImageFiles,
        keptImageUrls,
      });

      // Reset form if not editing
      if (!existingReview) {
        setRating(0);
        setDescription('');
        // Cleanup object URLs
        imageItems.forEach((i) => i.file && URL.revokeObjectURL(i.url));
        setImageItems([]);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAddMore = imageItems.length < MAX_REVIEW_IMAGES;

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
              <p className="text-sm text-muted-foreground mt-1">For: {productName}</p>
            )}
          </div>
          {onCancel && (
            <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Rating Input */}
        <div className="space-y-2">
          <Label htmlFor="rating">
            Your Rating <span className="text-destructive">*</span>
          </Label>
          <RatingInput value={rating} onChange={setRating} disabled={isSubmitting} />
          {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
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
            <span>{countCharacters(description)}/2000</span>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>
            Add Photos <span className="text-muted-foreground font-normal">(optional, up to {MAX_REVIEW_IMAGES})</span>
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {imageItems.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
              >
                <img src={item.url} alt="Review attachment" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(item.id)}
                  disabled={isSubmitting}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {canAddMore && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className={cn(
                  'aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',
                  'hover:border-primary hover:bg-primary/5',
                  'border-muted-foreground/30 bg-muted/30',
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Add</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Camera className="h-3 w-3" />
            Photos are auto-converted to WebP for fast loading
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleAddFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
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
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

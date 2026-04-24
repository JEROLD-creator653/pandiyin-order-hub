/**
 * Multi-image upload component for products.
 * Allows admin to upload up to N images, preview, reorder, and remove.
 */

import { useCallback, useRef, useState } from 'react';
import { Upload, X, GripVertical, ImagePlus, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { validateFile } from '@/lib/imageUpload';
import { toast } from 'sonner';

export interface MultiImageItem {
  id: string;
  url: string; // Preview URL (object URL for new files, https URL for existing)
  file?: File; // Present for newly added images
  existingPath?: string; // Storage path for existing images (for deletion)
}

interface MultiImageUploadProps {
  value: MultiImageItem[];
  onChange: (items: MultiImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export default function MultiImageUpload({
  value,
  onChange,
  maxImages = 3,
  disabled = false,
  className,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const remaining = maxImages - value.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const accepted = list.slice(0, remaining);
      const newItems: MultiImageItem[] = [];

      for (const file of accepted) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid file');
          continue;
        }
        newItems.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          url: URL.createObjectURL(file),
          file,
        });
      }

      if (newItems.length > 0) {
        onChange([...value, ...newItems]);
      }
      if (list.length > remaining) {
        toast.warning(`Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added`);
      }
    },
    [value, onChange, maxImages]
  );

  const handleRemove = (id: string) => {
    const item = value.find((i) => i.id === id);
    if (item?.file) URL.revokeObjectURL(item.url);
    onChange(value.filter((i) => i.id !== id));
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) {
      setDragIndex(null);
      return;
    }
    const next = [...value];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {value.map((item, idx) => (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(idx)}
            className={cn(
              'relative group rounded-lg overflow-hidden border-2 bg-muted aspect-square',
              dragIndex === idx ? 'border-primary opacity-50' : 'border-border',
              !disabled && 'cursor-move'
            )}
          >
            <img
              src={item.url}
              alt={`Product image ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] gap-1 px-1.5 py-0.5">
                <Star className="h-2.5 w-2.5 fill-current" />
                Main
              </Badge>
            )}
            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={disabled}
                className="bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 disabled:opacity-50"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {!disabled && value.length > 1 && (
              <div className="absolute bottom-1.5 left-1.5 bg-background/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
              'hover:border-primary hover:bg-primary/5',
              'border-muted-foreground/30 bg-muted/30',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Add Image</span>
            <span className="text-[10px] text-muted-foreground">
              {value.length}/{maxImages}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {value.length} of {maxImages} images • First image is the main thumbnail
        </span>
        {canAddMore && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-7 gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Browse
          </Button>
        )}
      </div>
    </div>
  );
}

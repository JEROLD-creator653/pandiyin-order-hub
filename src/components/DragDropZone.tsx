/**
 * Reusable Drag & Drop Zone Component
 * Can be used in forms or standalone
 * Features:
 * - Handles file drops
 * - Shows loading state
 * - Image preview
 * - Accessible (keyboard support)
 */

import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragDropZoneProps {
  onFile: (file: File) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  accept?: string;
}

export function DragDropZone({
  onFile,
  isLoading = false,
  disabled = false,
  className = '',
  children,
  accept = 'image/*',
}: DragDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.items?.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragActive(false);

    const files = e.dataTransfer?.files;
    if (files?.length) {
      onFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files?.length) {
      onFile(e.currentTarget.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDrag}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      className={cn(
        'relative flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200',
        isDragActive
          ? 'border-primary bg-primary/10 shadow-lg'
          : 'border-muted-foreground/30 bg-muted/20 hover:border-primary/50',
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      role="button"
      tabIndex={0}
      onClick={() => !isLoading && !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isLoading && !disabled) {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleInputChange}
        disabled={disabled || isLoading}
        accept={accept}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-col items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
        {children}
      </div>
    </div>
  );
}

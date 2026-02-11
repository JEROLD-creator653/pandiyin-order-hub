/**
 * Image Upload Component
 * Supports both file picker and drag & drop
 * Features:
 * - Drag & drop with visual feedback
 * - File preview
 * - Upload progress indicator
 * - Error handling with toast notifications
 */

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { validateFile, ALLOWED_FORMATS, MAX_FILE_SIZE } from '@/lib/imageUpload';

interface ImageUploadProps {
  onImageSelect: (file: File) => Promise<void> | void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  showPreview?: boolean;
}

export function ImageUpload({
  onImageSelect,
  isLoading = false,
  disabled = false,
  className = '',
  label = 'Upload Image',
  showPreview = true,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }

      setSelectedFile(file);

      // Generate preview
      if (showPreview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Call the parent handler
      try {
        setUploadProgress(0);
        await onImageSelect(file);
        setUploadProgress(100);
        // Preview persists until parent component resets it
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        toast.error(message);
        setPreview(null);
        setSelectedFile(null);
        setUploadProgress(0);
      }
    },
    [onImageSelect, showPreview]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemovePreview = () => {
    setPreview(null);
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {/* Preview */}
      {preview && showPreview && (
        <div className="mb-4 relative">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-primary/20">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            {uploadProgress === 100 ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="bg-green-500 rounded-full p-3">
                  <Check className="h-6 w-6 text-white" />
                </div>
              </div>
            ) : uploadProgress > 0 ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-2 w-32 rounded-full bg-white/30 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-white text-sm mt-2">{uploadProgress}%</p>
                </div>
              </div>
            ) : null}
          </div>
          {uploadProgress === 0 && (
            <button
              onClick={handleRemovePreview}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!preview && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
            isDragging
              ? 'border-primary bg-primary/10 scale-105'
              : 'border-muted-foreground/30 bg-muted/30 hover:border-primary/50'
          } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleInputChange}
          disabled={disabled || isLoading}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
          type="button"
          className="w-full"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground mt-1">
                or drag and drop
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              PNG, JPG, WEBP (Max 5MB)
            </div>
          </div>
        </button>
      </div>
      )}

      {/* File Info */}
      {selectedFile && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">{selectedFile.name}</p>
            <p>{(selectedFile.size / 1024 / 1024).toFixed(2)}MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon, Upload, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string | null) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const { uploads, isUploading, addFiles, uploadAll, clearUploads, hasValidFiles } = useFileUpload({
    maxFileSize: 10, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: 1
  });

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      await addFiles(files);
      
      // Upload the file immediately
      const uploadedFiles = await uploadAll('product-images');
      
      if (uploadedFiles.length > 0 && uploadedFiles[0].url) {
        onChange(uploadedFiles[0].url);
        toast.success('Image uploaded successfully');
        clearUploads();
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
    }
  }, [addFiles, uploadAll, onChange, clearUploads]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFileSelect(files);
  }, [handleFileSelect]);

  const removeImage = useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <Label>Product Image</Label>
      
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Product preview"
            className="w-full h-48 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeImage}
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!disabled) {
              document.getElementById('image-upload-input')?.click();
            }
          }}
        >
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {isUploading ? 'Uploading...' : 'Drag and drop an image here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">
            Supports: JPG, PNG, WEBP, GIF (max 10MB)
          </p>
          
          <Input
            id="image-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
        </div>
      )}
      
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(upload => (
            <div key={upload.id} className="flex items-center gap-2 text-sm">
              <div className="flex-1">
                {upload.file.name}
                {upload.status === 'uploading' && (
                  <div className="w-full bg-secondary rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {upload.status === 'error' && (
                <span className="text-destructive text-xs">{upload.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
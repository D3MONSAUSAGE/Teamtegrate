import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileIcon, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileUploadItem } from '@/hooks/useFileUpload';

interface FileDropZoneProps {
  uploads: FileUploadItem[];
  onFilesAdded: (files: File[]) => void;
  onFileRemoved: (id: string) => void;
  disabled?: boolean;
  maxFiles?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusColor = (status: FileUploadItem['status']) => {
  switch (status) {
    case 'pending': return 'bg-muted/50 border-muted-foreground/20';
    case 'uploading': return 'bg-primary/10 border-primary/30';
    case 'completed': return 'bg-success/10 border-success/30';
    case 'error': return 'bg-destructive/10 border-destructive/30';
    default: return 'bg-muted/50 border-muted-foreground/20';
  }
};

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  uploads,
  onFilesAdded,
  onFileRemoved,
  disabled = false,
  maxFiles = 10
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!disabled) {
      onFilesAdded(acceptedFiles);
    }
  }, [onFilesAdded, disabled]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept
  } = useDropzone({
    onDrop,
    disabled,
    maxFiles: maxFiles - uploads.length,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const dropZoneContent = () => {
    if (isDragActive) {
      return (
        <div className="flex flex-col items-center gap-2 text-primary">
          <Upload className="h-8 w-8" />
          <p className="text-sm font-medium">
            {isDragAccept ? 'Drop files here' : 'Some files will be rejected'}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Upload className="h-8 w-8" />
        <div className="text-center">
          <p className="text-sm font-medium">Drop files here or click to browse</p>
          <p className="text-xs">Support: Images, PDF, DOC, TXT, ZIP (max 50MB)</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragAccept && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          !isDragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        {dropZoneContent()}
      </div>

      {/* File List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                getStatusColor(upload.status)
              )}
            >
              {/* File Icon or Preview */}
              <div className="flex-shrink-0">
                {upload.preview ? (
                  <img
                    src={upload.preview}
                    alt={upload.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : upload.file.type.startsWith('image/') ? (
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <FileIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(upload.file.size)}
                </p>
                
                {/* Progress Bar */}
                {upload.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="w-full bg-muted-foreground/20 rounded-full h-1">
                      <div
                        className="bg-primary h-1 rounded-full transition-all"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Error Message */}
                {upload.status === 'error' && upload.error && (
                  <p className="text-xs text-destructive mt-1">{upload.error}</p>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2">
                {upload.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                
                {upload.status === 'completed' && (
                  <div className="h-2 w-2 bg-success rounded-full" />
                )}
                
                {upload.status === 'error' && (
                  <div className="h-2 w-2 bg-destructive rounded-full" />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onFileRemoved(upload.id)}
                  disabled={upload.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
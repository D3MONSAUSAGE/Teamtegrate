import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  FileVideo, 
  FileArchive,
  X,
  Download,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/utils';

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface ModuleFileUploaderProps {
  onFileUploaded: (filePath: string, fileName: string, fileSize: number, fileUrl: string) => void;
  onFileRemoved: () => void;
  existingFile?: {
    fileName: string;
    filePath: string;
    fileSize: number;
  };
  moduleId?: string;
  organizationId: string;
  disabled?: boolean;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
  if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-8 w-8 text-blue-500" />;
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FileVideo className="h-8 w-8 text-orange-500" />;
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileArchive className="h-8 w-8 text-green-500" />;
  if (fileType.includes('image')) return <Image className="h-8 w-8 text-purple-500" />;
  if (fileType.includes('text')) return <FileText className="h-8 w-8 text-gray-500" />;
  return <File className="h-8 w-8 text-gray-500" />;
};

export default function ModuleFileUploader({
  onFileUploaded,
  onFileRemoved,
  existingFile,
  moduleId,
  organizationId,
  disabled = false
}: ModuleFileUploaderProps) {
  const [upload, setUpload] = useState<FileUploadItem | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit`;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'File type not supported. Please use PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, or image files.';
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<void> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `training-modules/${organizationId}/${moduleId || 'temp'}/${fileName}`;

    const uploadItem: FileUploadItem = {
      file,
      id: Date.now().toString(),
      progress: 0,
      status: 'uploading'
    };

    setUpload(uploadItem);

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const completedUpload = {
        ...uploadItem,
        status: 'completed' as const,
        progress: 100,
        url: publicUrl
      };

      setUpload(completedUpload);
      onFileUploaded(filePath, file.name, file.size, publicUrl);
      toast.success('File uploaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUpload({
        ...uploadItem,
        status: 'error',
        error: errorMessage
      });
      toast.error(errorMessage);
    }
  };

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0]; // Only handle single file
    const error = validateFile(file);
    
    if (error) {
      toast.error(error);
      return;
    }

    await uploadFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleRemoveFile = async () => {
    if (existingFile?.filePath) {
      try {
        await supabase.storage
          .from('documents')
          .remove([existingFile.filePath]);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    
    setUpload(null);
    onFileRemoved();
    toast.success('File removed');
  };

  const handleViewFile = () => {
    if (upload?.url) {
      window.open(upload.url, '_blank');
    } else if (existingFile) {
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(existingFile.filePath);
      window.open(publicUrl, '_blank');
    }
  };

  const handleDownloadFile = () => {
    if (upload?.url) {
      const link = document.createElement('a');
      link.href = upload.url;
      link.download = upload.file.name;
      link.click();
    } else if (existingFile) {
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(existingFile.filePath);
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = existingFile.fileName;
      link.click();
    }
  };

  // Show existing file or uploaded file
  if (existingFile || (upload && upload.status === 'completed')) {
    const file = existingFile || upload;
    const fileName = existingFile?.fileName || upload?.file.name || '';
    const fileSize = existingFile?.fileSize || upload?.file.size || 0;
    const fileType = upload?.file.type || 'application/octet-stream';

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(fileType)}
              <div>
                <p className="font-medium text-sm">{fileName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewFile}
                disabled={disabled}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadFile}
                disabled={disabled}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show upload in progress
  if (upload && upload.status === 'uploading') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {getFileIcon(upload.file.type)}
            <div className="flex-1">
              <p className="font-medium text-sm">{upload.file.name}</p>
              <Progress value={upload.progress} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (upload && upload.status === 'error') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(upload.file.type)}
              <div>
                <p className="font-medium text-sm">{upload.file.name}</p>
                <p className="text-xs text-red-500">{upload.error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpload(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show upload area
  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => {
        if (!disabled) {
          document.getElementById('file-upload')?.click();
        }
      }}
    >
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={handleFileInput}
        disabled={disabled}
      />
      
      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Upload Training File</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop a file here, or click to select
      </p>
      <p className="text-xs text-muted-foreground">
        Supports: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, Images
        <br />
        Maximum file size: 50MB
      </p>
    </div>
  );
}
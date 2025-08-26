import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
  preview?: string;
}

interface UseFileUploadProps {
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
}

const DEFAULT_MAX_SIZE = 50; // 50MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip', 'text/plain'
];

export function useFileUpload({
  maxFileSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxFiles = 10
}: UseFileUploadProps = {}) {
  const [uploads, setUploads] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported';
    }
    return null;
  }, [maxFileSize, allowedTypes]);

  const generatePreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    if (uploads.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newUploads: FileUploadItem[] = [];
    
    for (const file of files) {
      const error = validateFile(file);
      const preview = await generatePreview(file);
      
      newUploads.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
        preview
      });
    }

    setUploads(prev => [...prev, ...newUploads]);
  }, [uploads.length, maxFiles, validateFile, generatePreview]);

  const removeFile = useCallback((id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  }, []);

  const uploadFile = useCallback(async (upload: FileUploadItem, roomId: string): Promise<FileUploadItem> => {
    const { file } = upload;
    const fileExt = file.name.split('.').pop();
    const fileName = `${upload.id}.${fileExt}`;
    const filePath = `chat-files/${roomId}/${fileName}`;

    try {
      setUploads(prev => prev.map(u => 
        u.id === upload.id 
          ? { ...u, status: 'uploading' as const, progress: 0 }
          : u
      ));

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
        ...upload,
        status: 'completed' as const,
        progress: 100,
        url: publicUrl
      };

      setUploads(prev => prev.map(u => 
        u.id === upload.id ? completedUpload : u
      ));

      return completedUpload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploads(prev => prev.map(u => 
        u.id === upload.id 
          ? { ...u, status: 'error' as const, error: errorMessage }
          : u
      ));

      throw error;
    }
  }, []);

  const uploadAll = useCallback(async (roomId: string): Promise<FileUploadItem[]> => {
    const pendingUploads = uploads.filter(u => u.status === 'pending');
    
    if (pendingUploads.length === 0) {
      return uploads.filter(u => u.status === 'completed');
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = pendingUploads.map(upload => uploadFile(upload, roomId));
      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results
        .filter((result): result is PromiseFulfilledResult<FileUploadItem> => result.status === 'fulfilled')
        .map(result => result.value);

      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .length;

      if (failed > 0) {
        toast.error(`${failed} file(s) failed to upload`);
      }

      return successful;
    } finally {
      setIsUploading(false);
    }
  }, [uploads, uploadFile]);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const hasValidFiles = uploads.some(u => u.status === 'pending' || u.status === 'completed');

  return {
    uploads,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    clearUploads,
    hasValidFiles
  };
}
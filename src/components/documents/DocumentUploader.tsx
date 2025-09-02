
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DocumentUploaderProps {
  folder?: string;
  teamId?: string;
  onUploadComplete?: () => void;
}

export const DocumentUploader = ({ folder, teamId, onUploadComplete }: DocumentUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const uploadFile = useCallback(async (file: File) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    try {
      setUploading(true);
      const timestamp = new Date().getTime();
      const filePath = `${user.organizationId}/${folder ? `${folder}/` : ''}${timestamp}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('Storage error:', storageError);
        throw storageError;
      }
      
      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          title: file.name,
          file_path: filePath,
          file_type: file.type,
          size_bytes: file.size,
          folder: folder,
          team_id: teamId,
          storage_id: filePath,
          user_id: user!.id,
          organization_id: user!.organizationId
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      toast.success(`${file.name} uploaded successfully.`);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  }, [user?.organizationId, folder, teamId, onUploadComplete, user?.id]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    await uploadFile(file);
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center ${isDragActive ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <FilePlus className="h-6 w-6 text-gray-500 dark:text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isDragActive ? "Drop the file here..." : "Drag 'n' drop a file here, or click to select a file"}
        </p>
      </div>
      {uploading && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Uploading...
        </p>
      )}
    </div>
  );
};

export default DocumentUploader;

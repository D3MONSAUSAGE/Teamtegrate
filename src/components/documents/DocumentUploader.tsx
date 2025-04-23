
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentUploaderProps {
  onUploadComplete: () => void;
  folder?: string; // NEW
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUploadComplete,
  folder = "",
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!user || !user.id) {
        toast({
          title: "Error",
          description: "You must be logged in to upload documents",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      try {
        // Compose path (optionally prefix with folder)
        let filePath = `${user.id}/${Date.now()}-${file.name}`;
        if (folder) {
          filePath = `${user.id}/${folder}/${Date.now()}-${file.name}`;
        }

        // Upload to storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          console.error('Storage error:', storageError);
          throw storageError;
        }

        // Insert metadata into documents table
        const { error: dbError } = await supabase.from('documents').insert({
          title: file.name,
          file_path: storageData.path,
          file_type: file.type,
          size_bytes: file.size,
          user_id: user.id,
          storage_id: storageData.id || filePath,
          folder: folder || null,
        });

        if (dbError) {
          console.error('Database error:', dbError);
          throw dbError;
        }

        toast({
          title: "Success",
          description: "Document uploaded successfully",
        });

        onUploadComplete();
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Error",
          description: "Failed to upload document. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete, user, toast, folder]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
        ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="mt-2 text-sm text-gray-600">Uploading document...</p>
        </div>
      ) : (
        <>
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? "Drop the file here"
              : folder
              ? `Upload to "${folder}"`
              : "Tap to select a document to upload"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PDF, DOC, DOCX
          </p>
        </>
      )}
    </div>
  );
};

export default DocumentUploader;

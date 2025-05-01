
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatAttachment {
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
}

export interface FileUpload {
  file: File;
  progress: number;
}

export function useChatFileUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (fileUploads: FileUpload[], roomId: string) => {
    if (fileUploads.length === 0) return [];
    
    setUploading(true);
    try {
      const attachments = await Promise.all(
        fileUploads.map(upload => uploadFileToSupabase(upload.file, roomId))
      );
      return attachments;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
      return [];
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading };
}

export async function uploadFileToSupabase(file: File, userId: string) {
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${timestamp}-${file.name}`;

  const { error: uploadError, data } = await supabase.storage
    .from('chat-attachments')
    .upload(filePath, file);

  if (uploadError) {
    toast.error('Failed to upload file');
    throw uploadError;
  }

  return {
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    file_path: filePath
  };
}

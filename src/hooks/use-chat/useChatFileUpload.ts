
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatAttachment {
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
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

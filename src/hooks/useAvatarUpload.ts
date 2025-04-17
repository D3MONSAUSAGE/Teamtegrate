
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useAvatarUpload = (userId: string) => {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: bucketError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2
      });
      
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Error creating bucket:', bucketError);
        toast.error('Error setting up storage');
        return null;
      }
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        toast.error('Error uploading avatar');
        console.error(uploadError);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return publicUrl;
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('An unexpected error occurred');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading };
};

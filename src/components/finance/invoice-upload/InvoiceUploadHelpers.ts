
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface InvoiceUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export const uploadInvoiceFile = async (
  file: File,
  organizationId: string,
  userId: string
): Promise<InvoiceUploadResult> => {
  try {
    const timestamp = new Date().getTime();
    const filePath = `${organizationId}/invoices/${userId}/${timestamp}-${file.name}`;
    
    console.log('Starting file upload to path:', filePath);
    
    // Upload file to storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return { success: false, error: `Upload failed: ${storageError.message}` };
    }

    console.log('File uploaded successfully, verifying existence...');

    // Immediately verify file exists
    const { data: verifyData, error: verifyError } = await supabase.storage
      .from('documents')
      .list(filePath.substring(0, filePath.lastIndexOf('/')));

    if (verifyError) {
      console.error('File verification error:', verifyError);
      return { success: false, error: 'File upload verification failed' };
    }

    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const fileExists = verifyData?.some(f => f.name === fileName);

    if (!fileExists) {
      console.error('File not found after upload:', fileName);
      return { success: false, error: 'File upload verification failed - file not found' };
    }

    console.log('File upload and verification successful');
    return { success: true, filePath };

  } catch (error) {
    console.error('Upload process error:', error);
    return { success: false, error: 'Unexpected upload error' };
  }
};

export const verifyInvoiceFileExists = async (filePath: string): Promise<boolean> => {
  try {
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');
    
    const { data, error } = await supabase.storage
      .from('documents')
      .list(folderPath);

    if (error) {
      console.error('File verification error:', error);
      return false;
    }

    return data?.some(file => file.name === fileName) || false;
  } catch (error) {
    console.error('File verification failed:', error);
    return false;
  }
};

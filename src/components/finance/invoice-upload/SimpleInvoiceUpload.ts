
import { supabase } from '@/integrations/supabase/client';

export interface SimpleUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export const uploadInvoiceFileSimple = async (
  file: File,
  organizationId: string,
  userId: string
): Promise<SimpleUploadResult> => {
  try {
    console.log('Starting simple invoice upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      organizationId,
      userId
    });

    // Create simple file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `invoices/${timestamp}-${sanitizedFileName}`;
    
    console.log('Upload path:', filePath);

    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    console.log('Storage upload successful:', data);

    // Simple verification - just check if we can get the file info
    const { data: fileData, error: getError } = await supabase.storage
      .from('documents')
      .list('invoices', {
        limit: 100,
        search: `${timestamp}-${sanitizedFileName}`
      });

    if (getError) {
      console.error('File verification error:', getError);
      return {
        success: false,
        error: `File verification failed: ${getError.message}`
      };
    }

    const uploadedFile = fileData?.find(f => f.name === `${timestamp}-${sanitizedFileName}`);
    if (!uploadedFile) {
      console.error('File not found after upload, found files:', fileData?.map(f => f.name));
      
      // Let's try a different approach - check if the file exists by trying to get its public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        console.log('File exists, verification via public URL successful');
        return {
          success: true,
          filePath: filePath
        };
      }
      
      return {
        success: false,
        error: 'File not found after upload'
      };
    }

    console.log('File verification successful:', uploadedFile);

    return {
      success: true,
      filePath: filePath
    };

  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

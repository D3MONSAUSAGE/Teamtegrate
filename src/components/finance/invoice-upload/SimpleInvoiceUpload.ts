
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

    // Verify file exists
    const { data: files, error: listError } = await supabase.storage
      .from('documents')
      .list('invoices');

    if (listError) {
      console.error('File verification error:', listError);
      return {
        success: false,
        error: `File verification failed: ${listError.message}`
      };
    }

    const uploadedFile = files?.find(f => f.name === `${timestamp}-${sanitizedFileName}`);
    if (!uploadedFile) {
      console.error('File not found after upload');
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

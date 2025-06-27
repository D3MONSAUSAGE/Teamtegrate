
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
    console.log('Starting standardized invoice upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      organizationId,
      userId
    });

    // Generate standardized file path using organization-based structure
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${organizationId}/invoices/${timestamp}-${sanitizedFileName}`;
    
    console.log('Standardized upload path:', filePath);

    // Upload to storage with organization-based path
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

    // Since bucket is now public, verify using public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error('Failed to get public URL for uploaded file');
      return {
        success: false,
        error: 'Failed to verify file upload'
      };
    }

    console.log('File upload and verification successful');

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

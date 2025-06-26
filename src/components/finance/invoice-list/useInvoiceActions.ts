
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface Invoice {
  id: string;
  invoice_number: string;
  branch: string;
  uploader_name: string;
  invoice_date: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
}

export const useInvoiceActions = () => {
  const downloadInvoice = async (invoice: Invoice) => {
    try {
      console.log('Downloading invoice with file path:', invoice.file_path);
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(invoice.file_path);

      if (error) {
        console.error('Download error:', error);
        
        // Provide more specific error messages
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          toast.error(`File not found: ${invoice.file_name}. The file may have been moved or deleted.`);
        } else {
          toast.error(`Download failed: ${error.message}`);
        }
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = invoice.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${invoice.file_name}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download invoice. Please try again.');
    }
  };

  const verifyFileExists = async (filePath: string): Promise<boolean> => {
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

  const viewInvoice = async (
    invoice: Invoice, 
    setImageUrl: (url: string) => void,
    setViewingInvoice: (invoice: Invoice) => void,
    setViewModalOpen: (open: boolean) => void
  ) => {
    try {
      console.log('Viewing invoice with file path:', invoice.file_path);
      
      // First, verify the file exists
      const fileExists = await verifyFileExists(invoice.file_path);
      if (!fileExists) {
        console.error('File does not exist:', invoice.file_path);
        toast.error(`Invoice file not found: ${invoice.file_name}. The file may have been moved, deleted, or failed to upload properly.`, {
          description: 'Try re-uploading the invoice if you have the original file.',
          duration: 6000,
        });
        return;
      }

      // Method 1: Try createSignedUrl (most reliable for viewing)
      try {
        console.log('Attempting signed URL method...');
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(invoice.file_path, 3600); // 1 hour expiry

        if (!signedUrlError && signedUrlData?.signedUrl) {
          console.log('Signed URL created successfully');
          setImageUrl(signedUrlData.signedUrl);
          setViewingInvoice(invoice);
          setViewModalOpen(true);
          return;
        } else {
          console.warn('Signed URL failed:', signedUrlError);
        }
      } catch (signedUrlError) {
        console.warn('Signed URL method failed:', signedUrlError);
      }

      // Method 2: Try getPublicUrl (faster if bucket allows public access)
      try {
        console.log('Attempting public URL method...');
        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(invoice.file_path);

        if (publicUrlData?.publicUrl) {
          console.log('Public URL created successfully');
          // Test if the public URL is accessible
          const testResponse = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
          if (testResponse.ok) {
            setImageUrl(publicUrlData.publicUrl);
            setViewingInvoice(invoice);
            setViewModalOpen(true);
            return;
          } else {
            console.warn('Public URL not accessible:', testResponse.status);
          }
        }
      } catch (publicUrlError) {
        console.warn('Public URL method failed:', publicUrlError);
      }

      // Method 3: Fallback to download method (original approach)
      try {
        console.log('Attempting download method as fallback...');
        const { data, error } = await supabase.storage
          .from('documents')
          .download(invoice.file_path);

        if (error) {
          console.error('Download method error:', error);
          throw error;
        }

        const url = window.URL.createObjectURL(data);
        setImageUrl(url);
        setViewingInvoice(invoice);
        setViewModalOpen(true);
        return;
      } catch (downloadError) {
        console.error('Download method failed:', downloadError);
      }

      // If all methods fail, show a detailed error with suggestions
      toast.error(`Unable to view invoice: ${invoice.file_name}`, {
        description: 'All viewing methods failed. The file may be corrupted or inaccessible. Try downloading instead or contact support.',
        duration: 8000,
      });

    } catch (error) {
      console.error('View failed with all methods:', error);
      toast.error(`Failed to view invoice: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        description: 'Please try again or contact support if the issue persists.',
        duration: 6000,
      });
    }
  };

  const deleteInvoice = async (invoice: Invoice, refetchInvoices: () => void) => {
    if (!confirm(`Are you sure you want to delete invoice "${invoice.invoice_number}"?`)) {
      return;
    }

    try {
      console.log('Deleting invoice with file path:', invoice.file_path);
      
      // Check if file exists before attempting to delete
      const fileExists = await verifyFileExists(invoice.file_path);
      
      if (fileExists) {
        // Delete from storage first
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([invoice.file_path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Don't throw error here - proceed with database deletion even if file doesn't exist
          console.warn('File may have already been deleted from storage');
        }
      } else {
        console.warn('File does not exist in storage, proceeding with database cleanup');
      }

      // Then delete from database
      const { error: dbError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      toast.success(`Deleted invoice "${invoice.invoice_number}"`);
      refetchInvoices();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete invoice. Please try again.');
    }
  };

  return {
    downloadInvoice,
    viewInvoice,
    deleteInvoice
  };
};

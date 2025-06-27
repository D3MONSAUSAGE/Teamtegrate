
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
      
      // Use public URL for download since bucket is now public
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(invoice.file_path);

      if (!urlData?.publicUrl) {
        toast.error(`Failed to generate download URL for: ${invoice.file_name}`);
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = urlData.publicUrl;
      link.download = invoice.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${invoice.file_name}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download invoice. Please try again.');
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
      
      // Use public URL for viewing since bucket is now public
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(invoice.file_path);

      if (!urlData?.publicUrl) {
        toast.error(`Failed to generate view URL for: ${invoice.file_name}`);
        return;
      }

      console.log('Public URL generated successfully');
      setImageUrl(urlData.publicUrl);
      setViewingInvoice(invoice);
      setViewModalOpen(true);

    } catch (error) {
      console.error('View failed:', error);
      toast.error(`Failed to view invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteInvoice = async (invoice: Invoice, refetchInvoices: () => void) => {
    if (!confirm(`Are you sure you want to delete invoice "${invoice.invoice_number}"?`)) {
      return;
    }

    try {
      console.log('Deleting invoice with file path:', invoice.file_path);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([invoice.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if file deletion fails
        console.warn('File may have already been deleted from storage');
      }

      // Delete from database
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

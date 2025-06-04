
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(invoice.file_path);

      if (error) {
        console.error('Download error:', error);
        toast({
          title: "Error",
          description: 'Failed to download invoice',
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = invoice.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: 'Invoice downloaded successfully',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: 'Failed to download invoice',
        variant: "destructive",
      });
    }
  };

  const viewInvoice = async (
    invoice: Invoice,
    setImageUrl: (url: string) => void,
    setViewingInvoice: (invoice: Invoice) => void,
    setViewModalOpen: (open: boolean) => void
  ) => {
    try {
      // For PDFs, get a signed URL and open in new tab
      if (invoice.file_type === 'application/pdf') {
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(invoice.file_path, 3600); // 1 hour expiry

        if (error) {
          console.error('View error:', error);
          toast({
            title: "Error",
            description: 'Failed to view invoice',
            variant: "destructive",
          });
          return;
        }

        window.open(data.signedUrl, '_blank');
        return;
      }

      // For images, get signed URL and show in modal
      if (invoice.file_type.startsWith('image/')) {
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(invoice.file_path, 3600); // 1 hour expiry

        if (error) {
          console.error('View error:', error);
          toast({
            title: "Error",
            description: 'Failed to view invoice',
            variant: "destructive",
          });
          return;
        }

        setImageUrl(data.signedUrl);
        setViewingInvoice(invoice);
        setViewModalOpen(true);
        return;
      }

      toast({
        title: "Error",
        description: 'File type not supported for viewing',
        variant: "destructive",
      });
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "Error",
        description: 'Failed to view invoice',
        variant: "destructive",
      });
    }
  };

  const deleteInvoice = async (invoice: Invoice, onSuccess: () => void) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([invoice.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        toast({
          title: "Error",
          description: 'Failed to delete invoice file from storage',
          variant: "destructive",
        });
        return;
      }

      // Delete record from database
      const { error: dbError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        toast({
          title: "Error",
          description: 'Failed to delete invoice record',
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: 'Invoice deleted successfully',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: 'Failed to delete invoice',
        variant: "destructive",
      });
    }
  };

  return {
    downloadInvoice,
    viewInvoice,
    deleteInvoice
  };
};

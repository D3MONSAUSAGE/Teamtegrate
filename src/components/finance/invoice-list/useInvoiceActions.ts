
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
      console.log('Downloading invoice from path:', invoice.file_path);
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(invoice.file_path);

      if (error) {
        console.error('Download error:', error);
        toast({
          title: "Error",
          description: `Failed to download invoice: ${error.message}`,
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
      console.log('Viewing invoice from path:', invoice.file_path);
      
      // Get signed URL for viewing
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(invoice.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('View error:', error);
        
        // Try to handle legacy file paths - check if file exists in old format
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log('File not found, trying legacy path format...');
          
          // Try different path formats for backwards compatibility
          const legacyPaths = [
            `${invoice.file_name}`, // Just filename
            `invoices/${invoice.file_name}`, // Simple invoices folder
            invoice.file_path.replace(/^invoices\/[^\/]+\/[^\/]+\//, 'invoices/') // Remove org/user folders
          ];

          for (const legacyPath of legacyPaths) {
            console.log('Trying legacy path:', legacyPath);
            const { data: legacyData, error: legacyError } = await supabase.storage
              .from('documents')
              .createSignedUrl(legacyPath, 3600);

            if (!legacyError && legacyData) {
              console.log('Found file at legacy path:', legacyPath);
              
              if (invoice.file_type === 'application/pdf') {
                window.open(legacyData.signedUrl, '_blank');
                return;
              }

              if (invoice.file_type.startsWith('image/')) {
                setImageUrl(legacyData.signedUrl);
                setViewingInvoice(invoice);
                setViewModalOpen(true);
                return;
              }
            }
          }
        }
        
        toast({
          title: "Error",
          description: `Failed to view invoice: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Successfully got signed URL for viewing');

      // For PDFs, open in new tab
      if (invoice.file_type === 'application/pdf') {
        window.open(data.signedUrl, '_blank');
        return;
      }

      // For images, show in modal
      if (invoice.file_type.startsWith('image/')) {
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
      console.log('Deleting invoice from path:', invoice.file_path);
      
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([invoice.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Don't fail deletion if file doesn't exist in storage
        if (!storageError.message.includes('not found') && !storageError.message.includes('does not exist')) {
          toast({
            title: "Error",
            description: `Failed to delete invoice file from storage: ${storageError.message}`,
            variant: "destructive",
          });
          return;
        }
        console.log('File not found in storage, continuing with database deletion...');
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
          description: `Failed to delete invoice record: ${dbError.message}`,
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

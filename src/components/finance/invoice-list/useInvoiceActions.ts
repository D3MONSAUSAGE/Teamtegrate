import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice } from '@/types/invoice';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';
import type { CreatedInvoice } from '@/types/invoices';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';

export const useInvoiceActions = () => {
  const downloadInvoice = async (invoice: Invoice) => {
    try {
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
      // Use public URL for viewing since bucket is now public
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(invoice.file_path);

      if (!urlData?.publicUrl) {
        toast.error(`Failed to generate view URL for: ${invoice.file_name}`);
        return;
      }

      setImageUrl(urlData.publicUrl);
      setViewingInvoice(invoice);
      setViewModalOpen(true);

    } catch (error) {
      console.error('View failed:', error);
      toast.error(`Failed to view invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const viewUnifiedInvoice = async (
    invoice: UnifiedInvoice,
    setImageUrl: (url: string) => void,
    setInvoiceData: (data: CreatedInvoice | null) => void,
    setViewingInvoice: (invoice: UnifiedInvoice) => void,
    setViewModalOpen: (open: boolean) => void
  ) => {
    try {
      console.log('viewUnifiedInvoice called for:', invoice.invoice_number, 'source:', invoice.source);
      
      // Set viewing invoice first
      setViewingInvoice(invoice);
      
      if (invoice.source === 'uploaded') {
        console.log('Fetching public URL for uploaded invoice...');
        // For uploaded invoices, fetch the public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(invoice.uploaded_data!.file_path);

        if (!urlData?.publicUrl) {
          toast.error(`Failed to generate view URL for: ${invoice.uploaded_data?.file_name}`);
          return;
        }

        console.log('Public URL fetched:', urlData.publicUrl);
        setImageUrl(urlData.publicUrl);
        setInvoiceData(null);
      } else {
        console.log('Fetching full invoice data for created invoice...');
        // For created invoices, fetch full invoice data with relations
        const { data: fullInvoice, error } = await supabase
          .from('created_invoices')
          .select(`
            *,
            line_items:invoice_line_items(*),
            client:invoice_clients(*)
          `)
          .eq('id', invoice.id)
          .single();

        if (error || !fullInvoice) {
          console.error('Failed to load invoice data:', error);
          toast.error('Failed to load invoice data');
          return;
        }

        console.log('Invoice data fetched successfully:', fullInvoice);
        setInvoiceData(fullInvoice as CreatedInvoice);
        setImageUrl('');
      }

      console.log('Opening modal...');
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
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([invoice.file_path]);

      if (storageError) {
        // Continue with database deletion even if file deletion fails
        console.warn('File may have already been deleted from storage');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) throw dbError;

      toast.success(`Deleted invoice "${invoice.invoice_number}"`);
      refetchInvoices();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete invoice. Please try again.');
    }
  };

  const downloadUnifiedInvoice = async (invoice: UnifiedInvoice) => {
    try {
      if (invoice.source === 'uploaded') {
        // Download uploaded file from storage
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(invoice.uploaded_data!.file_path);

        if (!urlData?.publicUrl) {
          toast.error(`Failed to generate download URL for: ${invoice.uploaded_data?.file_name}`);
          return;
        }

        const link = document.createElement('a');
        link.href = urlData.publicUrl;
        link.download = invoice.uploaded_data!.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Downloaded ${invoice.uploaded_data!.file_name}`);
      } else {
        // Generate PDF for created invoices
        toast.info('Generating PDF...');

        const { data: fullInvoice, error } = await supabase
          .from('created_invoices')
          .select(`
            *,
            line_items:invoice_line_items(*),
            client:invoice_clients(*)
          `)
          .eq('id', invoice.id)
          .single();

        if (error || !fullInvoice) {
          console.error('Failed to load invoice data:', error);
          toast.error('Failed to load invoice data for PDF generation');
          return;
        }

        // Invoice already has company branding snapshot fields
        await generateInvoicePDF(fullInvoice as CreatedInvoice);
        toast.success('Invoice PDF downloaded successfully');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download invoice. Please try again.');
    }
  };

  return {
    downloadInvoice,
    viewInvoice,
    viewUnifiedInvoice,
    deleteInvoice,
    downloadUnifiedInvoice
  };
};

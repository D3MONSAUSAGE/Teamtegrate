import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Download, FileText, Calendar, User, Building, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';

const BRANCH_OPTIONS = [
  'All Branches',
  'Sylmar',
  'Canyon', 
  'Via Princessa',
  'Palmdale',
  'Panorama',
  'Cocina',
  'Corp'
];

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

interface InvoiceListProps {
  refreshTrigger: number;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ refreshTrigger }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [dateFilter, setDateFilter] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to load invoices');
        return;
      }

      setInvoices(data || []);
      setFilteredInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshTrigger]);

  useEffect(() => {
    let filtered = invoices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.uploader_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Branch filter
    if (selectedBranch !== 'All Branches') {
      filtered = filtered.filter(invoice => invoice.branch === selectedBranch);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        const filterDate = new Date(dateFilter);
        return invoiceDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, selectedBranch, dateFilter]);

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .download(invoice.file_path);

      if (error) {
        console.error('Download error:', error);
        toast.error('Failed to download invoice');
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

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const viewInvoice = async (invoice: Invoice) => {
    try {
      // For PDFs, get a signed URL and open in new tab
      if (invoice.file_type === 'application/pdf') {
        const { data, error } = await supabase.storage
          .from('invoices')
          .createSignedUrl(invoice.file_path, 3600); // 1 hour expiry

        if (error) {
          console.error('View error:', error);
          toast.error('Failed to view invoice');
          return;
        }

        window.open(data.signedUrl, '_blank');
        return;
      }

      // For images, get signed URL and show in modal
      if (invoice.file_type.startsWith('image/')) {
        const { data, error } = await supabase.storage
          .from('invoices')
          .createSignedUrl(invoice.file_path, 3600); // 1 hour expiry

        if (error) {
          console.error('View error:', error);
          toast.error('Failed to view invoice');
          return;
        }

        setImageUrl(data.signedUrl);
        setViewingInvoice(invoice);
        setViewModalOpen(true);
        return;
      }

      toast.error('File type not supported for viewing');
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to view invoice');
    }
  };

  const deleteInvoice = async (invoice: Invoice) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('invoices')
        .remove([invoice.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        toast.error('Failed to delete invoice file from storage');
        return;
      }

      // Delete record from database
      const { error: dbError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        toast.error('Failed to delete invoice record');
        return;
      }

      toast.success('Invoice deleted successfully');
      
      // Refresh the invoice list
      fetchInvoices();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading invoices...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>
            Search, filter, view, download, and delete uploaded invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by invoice # or uploader..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <Building className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRANCH_OPTIONS.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedBranch('All Branches');
                setDateFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </p>
          </div>

          {/* Invoice Table */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {invoices.length === 0 
                  ? "Get started by uploading your first invoice."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Uploader</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {invoice.branch}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {invoice.uploader_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {formatFileSize(invoice.file_size)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewInvoice(invoice)}
                            className="flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadInvoice(invoice)}
                            className="flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete invoice "{invoice.invoice_number}"? 
                                  This action cannot be undone and will permanently remove the invoice 
                                  file and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteInvoice(invoice)}
                                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                >
                                  Delete Invoice
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingInvoice?.invoice_number} - {viewingInvoice?.file_name}
            </DialogTitle>
          </DialogHeader>
          {imageUrl && (
            <div className="flex justify-center">
              <img 
                src={imageUrl} 
                alt={`Invoice ${viewingInvoice?.invoice_number}`}
                className="max-w-full max-h-[70vh] object-contain"
                onLoad={() => console.log('Image loaded successfully')}
                onError={() => {
                  console.error('Error loading image');
                  toast.error('Failed to load image');
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceList;

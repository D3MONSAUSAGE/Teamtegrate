
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Upload, Download, Search, Filter, Calendar, User, DollarSign, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import InvoiceUpload from './InvoiceUpload';

interface InvoiceListProps {
  onInvoiceUploaded?: () => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ onInvoiceUploaded }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterUploader, setFilterUploader] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to load invoices');
        return;
      }

      console.log('Fetched invoices:', data);
      setInvoices(data || []);
    } catch (error) {
      console.error('Error in fetchInvoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Get unique branches and uploaders for filters
  const branches = useMemo(() => {
    const uniqueBranches = [...new Set(invoices.map(inv => inv.branch))];
    return uniqueBranches.filter(Boolean);
  }, [invoices]);

  const uploaders = useMemo(() => {
    const uniqueUploaders = [...new Set(invoices.map(inv => inv.uploader_name))];
    return uniqueUploaders.filter(Boolean);
  }, [invoices]);

  // Filter and sort invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.uploader_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.branch.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBranch = filterBranch === 'all' || invoice.branch === filterBranch;
      const matchesUploader = filterUploader === 'all' || invoice.uploader_name === filterUploader;
      
      return matchesSearch && matchesBranch && matchesUploader;
    });

    // Sort invoices
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime();
          break;
        case 'name':
          comparison = a.invoice_number.localeCompare(b.invoice_number);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [invoices, searchQuery, filterBranch, filterUploader, sortBy, sortOrder]);

  // Calculate total file size
  const totalSize = useMemo(() => {
    return filteredAndSortedInvoices.reduce((total, invoice) => total + invoice.file_size, 0);
  }, [filteredAndSortedInvoices]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      // For now, just show a message. In a real app, you'd download from storage
      toast.info(`Downloading ${invoice.file_name}...`);
      console.log('Download invoice:', invoice);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
        return;
      }

      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const handlePreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreviewDialog(true);
  };

  const handleUploadSuccess = () => {
    fetchInvoices();
    setShowUploadDialog(false);
    if (onInvoiceUploaded) {
      onInvoiceUploaded();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Invoices...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-gray-600">
            {filteredAndSortedInvoices.length} invoices • {formatFileSize(totalSize)}
          </p>
        </div>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New Invoice</DialogTitle>
              <DialogDescription>
                Upload a new invoice document to the system.
              </DialogDescription>
            </DialogHeader>
            <InvoiceUpload onUploadSuccess={handleUploadSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by invoice number, uploader, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterUploader} onValueChange={setFilterUploader}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by uploader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Uploaders</SelectItem>
                  {uploaders.map(uploader => (
                    <SelectItem key={uploader} value={uploader}>{uploader}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterBranch !== 'all' || filterUploader !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first invoice to get started'
                }
              </p>
              {!searchQuery && filterBranch === 'all' && filterUploader === 'all' && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Invoice
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invoice.branch}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {invoice.uploader_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="truncate max-w-[200px]" title={invoice.file_name}>
                          {invoice.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(invoice.file_size)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {(user?.role === 'manager' || invoice.user_id === user?.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invoice)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                  <p className="font-medium">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p>{format(new Date(selectedInvoice.invoice_date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Branch</label>
                  <p>{selectedInvoice.branch}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Uploaded By</label>
                  <p>{selectedInvoice.uploader_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Name</label>
                  <p className="truncate">{selectedInvoice.file_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Size</label>
                  <p>{formatFileSize(selectedInvoice.file_size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Type</label>
                  <p>{selectedInvoice.file_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Uploaded</label>
                  <p>{format(new Date(selectedInvoice.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleDownload(selectedInvoice)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {(user?.role === 'manager' || selectedInvoice.user_id === user?.id) && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedInvoice);
                      setShowPreviewDialog(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceList;

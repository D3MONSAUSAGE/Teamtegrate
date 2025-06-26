
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface OrphanedInvoice {
  id: string;
  invoice_number: string;
  file_name: string;
  file_path: string;
  created_at: string;
}

const InvoiceDataIntegrityChecker: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [orphanedInvoices, setOrphanedInvoices] = useState<OrphanedInvoice[]>([]);
  const { user } = useAuth();

  const checkDataIntegrity = async () => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    setIsChecking(true);
    try {
      // Get all invoices for the organization
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, file_name, file_path, created_at')
        .eq('organization_id', user.organizationId);

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        toast.error('Failed to fetch invoices');
        return;
      }

      if (!invoices || invoices.length === 0) {
        toast.success('No invoices found to check');
        return;
      }

      // Check each invoice file
      const orphaned: OrphanedInvoice[] = [];
      
      for (const invoice of invoices) {
        try {
          const pathParts = invoice.file_path.split('/');
          const fileName = pathParts.pop();
          const folderPath = pathParts.join('/');
          
          const { data: files, error: listError } = await supabase.storage
            .from('documents')
            .list(folderPath);

          if (listError || !files?.some(file => file.name === fileName)) {
            orphaned.push(invoice);
          }
        } catch (error) {
          console.error(`Error checking file ${invoice.file_path}:`, error);
          orphaned.push(invoice);
        }
      }

      setOrphanedInvoices(orphaned);
      
      if (orphaned.length === 0) {
        toast.success('All invoice files are properly stored');
      } else {
        toast.warning(`Found ${orphaned.length} orphaned invoice record(s)`);
      }

    } catch (error) {
      console.error('Error checking data integrity:', error);
      toast.error('Failed to check data integrity');
    } finally {
      setIsChecking(false);
    }
  };

  const cleanupOrphanedRecords = async () => {
    if (orphanedInvoices.length === 0) {
      toast.info('No orphaned records to clean up');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${orphanedInvoices.length} orphaned invoice record(s)? This action cannot be undone.`)) {
      return;
    }

    setIsCleaning(true);
    try {
      const ids = orphanedInvoices.map(inv => inv.id);
      
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error cleaning up orphaned records:', error);
        toast.error('Failed to clean up orphaned records');
        return;
      }

      toast.success(`Successfully cleaned up ${orphanedInvoices.length} orphaned record(s)`);
      setOrphanedInvoices([]);
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast.error('Failed to clean up orphaned records');
    } finally {
      setIsCleaning(false);
    }
  };

  // Only show to admin users
  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <AlertTriangle className="h-5 w-5" />
          Data Integrity Checker
        </CardTitle>
        <CardDescription>
          Check for invoice records where the actual files are missing from storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={checkDataIntegrity}
            disabled={isChecking}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check Data Integrity'}
          </Button>
          
          {orphanedInvoices.length > 0 && (
            <Button
              onClick={cleanupOrphanedRecords}
              disabled={isCleaning}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isCleaning ? 'Cleaning...' : `Clean Up ${orphanedInvoices.length} Records`}
            </Button>
          )}
        </div>

        {orphanedInvoices.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-orange-800 dark:text-orange-200">
              Orphaned Records Found:
            </h4>
            <div className="space-y-1 text-sm">
              {orphanedInvoices.map(invoice => (
                <div key={invoice.id} className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                  <strong>{invoice.invoice_number}</strong> - {invoice.file_name}
                  <br />
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    Missing file: {invoice.file_path}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceDataIntegrityChecker;

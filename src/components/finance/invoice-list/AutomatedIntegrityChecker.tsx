
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, CheckCircle, Clock, FileText, Shield } from 'lucide-react';

interface IntegrityReport {
  totalInvoices: number;
  validInvoices: number;
  orphanedRecords: number;
  corruptedFiles: number;
  lastCheckTime: Date;
  issues: IntegrityIssue[];
}

interface IntegrityIssue {
  id: string;
  type: 'orphaned' | 'corrupted' | 'size_mismatch' | 'access_denied';
  invoiceId: string;
  invoiceNumber: string;
  filePath: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AutomatedIntegrityChecker: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false);
  const [lastAutoCheck, setLastAutoCheck] = useState<Date | null>(null);
  const { user } = useAuth();

  // Only show to admin users
  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return null;
  }

  // Auto-check on component mount and periodically
  useEffect(() => {
    // Check if we should run automatic check
    const lastCheck = localStorage.getItem('invoice_integrity_last_check');
    const shouldAutoCheck = !lastCheck || 
      (Date.now() - parseInt(lastCheck)) > 24 * 60 * 60 * 1000; // 24 hours

    if (shouldAutoCheck) {
      runIntegrityCheck(true);
    }

    // Set up periodic checks if enabled
    if (autoCheckEnabled) {
      const interval = setInterval(() => {
        runIntegrityCheck(true);
      }, 6 * 60 * 60 * 1000); // Every 6 hours

      return () => clearInterval(interval);
    }
  }, [autoCheckEnabled]);

  const runIntegrityCheck = async (isAutoCheck = false) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    setIsRunning(true);
    setProgress(0);

    try {
      // Get all invoices for the organization
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, file_name, file_path, file_size, created_at')
        .eq('organization_id', user.organizationId);

      if (invoicesError) {
        throw new Error(`Failed to fetch invoices: ${invoicesError.message}`);
      }

      if (!invoices || invoices.length === 0) {
        const emptyReport: IntegrityReport = {
          totalInvoices: 0,
          validInvoices: 0,
          orphanedRecords: 0,
          corruptedFiles: 0,
          lastCheckTime: new Date(),
          issues: []
        };
        setReport(emptyReport);
        setProgress(100);
        return;
      }

      const issues: IntegrityIssue[] = [];
      let validCount = 0;
      let orphanedCount = 0;
      let corruptedCount = 0;

      // Check each invoice file
      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];
        setProgress((i / invoices.length) * 100);

        try {
          // Check file existence and accessibility
          const fileCheck = await checkFileIntegrity(invoice);
          
          if (fileCheck.exists) {
            if (fileCheck.accessible && !fileCheck.corrupted) {
              validCount++;
            } else {
              corruptedCount++;
              issues.push({
                id: `corrupted-${invoice.id}`,
                type: 'corrupted',
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoice_number,
                filePath: invoice.file_path,
                description: fileCheck.error || 'File is corrupted or inaccessible',
                severity: 'high'
              });
            }
          } else {
            orphanedCount++;
            issues.push({
              id: `orphaned-${invoice.id}`,
              type: 'orphaned',
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              filePath: invoice.file_path,
              description: 'Database record exists but file is missing from storage',
              severity: 'critical'
            });
          }

          // Small delay to prevent overwhelming the system
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error) {
          issues.push({
            id: `error-${invoice.id}`,
            type: 'access_denied',
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            filePath: invoice.file_path,
            description: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'medium'
          });
        }
      }

      const integrityReport: IntegrityReport = {
        totalInvoices: invoices.length,
        validInvoices: validCount,
        orphanedRecords: orphanedCount,
        corruptedFiles: corruptedCount,
        lastCheckTime: new Date(),
        issues
      };

      setReport(integrityReport);
      setProgress(100);

      // Store last check time
      localStorage.setItem('invoice_integrity_last_check', Date.now().toString());
      setLastAutoCheck(new Date());

      // Show results
      if (!isAutoCheck || issues.length > 0) {
        if (issues.length === 0) {
          toast.success('Integrity check complete - All files are valid');
        } else {
          const criticalIssues = issues.filter(i => i.severity === 'critical').length;
          toast.warning(`Integrity check complete - Found ${issues.length} issues (${criticalIssues} critical)`);
        }
      }

    } catch (error) {
      console.error('Integrity check failed:', error);
      toast.error(`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const checkFileIntegrity = async (invoice: any): Promise<{
    exists: boolean;
    accessible: boolean;
    corrupted: boolean;
    error?: string;
  }> => {
    try {
      // Check if file exists in storage
      const pathParts = invoice.file_path.split('/');
      const fileName = pathParts.pop();
      const folderPath = pathParts.join('/');
      
      const { data: files, error: listError } = await supabase.storage
        .from('documents')
        .list(folderPath);

      if (listError) {
        return { exists: false, accessible: false, corrupted: false, error: listError.message };
      }

      const fileExists = files?.some(file => file.name === fileName);
      if (!fileExists) {
        return { exists: false, accessible: false, corrupted: false };
      }

      // Check file accessibility
      try {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(invoice.file_path);

        if (!urlData?.publicUrl) {
          return { exists: true, accessible: false, corrupted: false, error: 'Cannot generate access URL' };
        }

        // Try to access the file (head request to check accessibility)
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        if (!response.ok) {
          return { exists: true, accessible: false, corrupted: false, error: `HTTP ${response.status}` };
        }

        // Check file size if available
        const contentLength = response.headers.get('content-length');
        if (contentLength && invoice.file_size) {
          const actualSize = parseInt(contentLength);
          const expectedSize = invoice.file_size;
          const sizeDifference = Math.abs(actualSize - expectedSize);
          
          if (sizeDifference > 1024) { // Allow 1KB difference for metadata
            return { 
              exists: true, 
              accessible: true, 
              corrupted: true, 
              error: `Size mismatch: expected ${expectedSize}, got ${actualSize}` 
            };
          }
        }

        return { exists: true, accessible: true, corrupted: false };

      } catch (error) {
        return { 
          exists: true, 
          accessible: false, 
          corrupted: false, 
          error: `Access check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }

    } catch (error) {
      return { 
        exists: false, 
        accessible: false, 
        corrupted: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Shield className="h-5 w-5" />
          Automated Invoice Integrity Monitor
        </CardTitle>
        <CardDescription>
          Continuously monitors invoice file integrity and automatically detects data loss issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Panel */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            onClick={() => runIntegrityCheck(false)}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isRunning ? 'Checking...' : 'Run Integrity Check'}
          </Button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoCheckEnabled}
              onChange={(e) => setAutoCheckEnabled(e.target.checked)}
              className="rounded"
            />
            Enable automatic checks (every 6 hours)
          </label>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Checking invoice files...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Last Check Info */}
        {(lastAutoCheck || report) && (
          <div className="text-sm text-muted-foreground">
            Last check: {(lastAutoCheck || report?.lastCheckTime)?.toLocaleString()}
          </div>
        )}

        {/* Integrity Report */}
        {report && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-700 dark:text-green-300">Valid Files</div>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {report.validInvoices}
                </div>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm text-red-700 dark:text-red-300">Orphaned</div>
                <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                  {report.orphanedRecords}
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <div className="text-sm text-orange-700 dark:text-orange-300">Corrupted</div>
                <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                  {report.corruptedFiles}
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {report.totalInvoices}
                </div>
              </div>
            </div>

            {/* Issues List */}
            {report.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  Issues Found ({report.issues.length}):
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {report.issues.map(issue => (
                    <div key={issue.id} className="p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-red-400">
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <strong className="text-sm">{issue.invoiceNumber}</strong>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs text-white ${getSeverityColor(issue.severity)}`}
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            {issue.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {issue.filePath}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health Status */}
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                {report.issues.length === 0 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      All invoice files are healthy
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-300 font-medium">
                      {report.issues.filter(i => i.severity === 'critical').length} critical issues require immediate attention
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomatedIntegrityChecker;

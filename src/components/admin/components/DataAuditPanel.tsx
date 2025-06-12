
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuditResult {
  table_name: string;
  records_without_org: number;
  orphaned_records: number;
}

const DataAuditPanel: React.FC = () => {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runDataAudit = async () => {
    setIsRunning(true);
    try {
      console.log('Running organization data audit...');
      
      const { data, error } = await supabase.rpc('audit_organization_data');
      
      if (error) {
        console.error('Data audit failed:', error);
        toast({
          title: "Audit Failed",
          description: `Failed to run data audit: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      setAuditResults(data || []);
      
      const totalIssues = (data || []).reduce((sum, result) => 
        sum + result.records_without_org + result.orphaned_records, 0
      );

      if (totalIssues === 0) {
        toast({
          title: "Audit Complete",
          description: "✅ All data properly organized. No issues found!",
        });
      } else {
        toast({
          title: "Audit Complete",
          description: `Found ${totalIssues} data integrity issues that need attention.`,
          variant: "destructive",
        });
      }
      
      console.log('✅ Data audit completed:', data);
    } catch (error) {
      console.error('Data audit error:', error);
      toast({
        title: "Audit Error",
        description: "An unexpected error occurred during the audit.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (recordsWithoutOrg: number, orphanedRecords: number) => {
    const totalIssues = recordsWithoutOrg + orphanedRecords;
    
    if (totalIssues === 0) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Clean</Badge>;
    } else if (totalIssues < 5) {
      return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Minor Issues</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Issues Found</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          <CardTitle>Organization Data Audit</CardTitle>
        </div>
        <CardDescription>
          Monitor data integrity and organization assignment across all tables
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDataAudit} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Run Data Audit
          </Button>
        </div>

        {auditResults.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Audit Results</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records Without Org</TableHead>
                  <TableHead>Orphaned Records</TableHead>
                  <TableHead>Total Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditResults.map((result) => (
                  <TableRow key={result.table_name}>
                    <TableCell className="font-medium capitalize">
                      {result.table_name.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(result.records_without_org, result.orphaned_records)}
                    </TableCell>
                    <TableCell>
                      {result.records_without_org > 0 ? (
                        <span className="text-red-600 font-medium">{result.records_without_org}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.orphaned_records > 0 ? (
                        <span className="text-red-600 font-medium">{result.orphaned_records}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.records_without_org + result.orphaned_records > 0 ? (
                        <span className="text-red-600 font-medium">
                          {result.records_without_org + result.orphaned_records}
                        </span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">What these numbers mean:</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><strong>Records Without Org:</strong> Records missing organization_id (should be 0 after migration)</li>
                <li><strong>Orphaned Records:</strong> Records referencing non-existent organizations</li>
                <li><strong>Total Issues:</strong> Sum of all data integrity problems requiring attention</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataAuditPanel;

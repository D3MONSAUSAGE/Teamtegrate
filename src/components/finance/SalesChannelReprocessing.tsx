import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import { RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ReprocessingResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  totalFeesGenerated: number;
  errors?: string[];
}

export const SalesChannelReprocessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReprocessingResult | null>(null);
  const [summary, setSummary] = useState<{
    salesCount: number;
    existingTransactionCount: number;
    dateRange: { start: string; end: string };
  } | null>(null);

  const fetchSummary = async () => {
    try {
      // Get sales data summary
      const { data: salesData } = await supabase
        .from('sales_data')
        .select('id, date')
        .order('date', { ascending: true });

      if (!salesData || salesData.length === 0) {
        setSummary({
          salesCount: 0,
          existingTransactionCount: 0,
          dateRange: { start: '', end: '' },
        });
        return;
      }

      // Count existing transactions
      const salesIds = salesData.map(s => s.id);
      const { count } = await supabase
        .from('sales_channel_transactions')
        .select('*', { count: 'exact', head: true })
        .in('sales_data_id', salesIds);

      setSummary({
        salesCount: salesData.length,
        existingTransactionCount: count || 0,
        dateRange: {
          start: salesData[0].date,
          end: salesData[salesData.length - 1].date,
        },
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Failed to load summary');
    }
  };

  const handleReprocess = async () => {
    if (!confirm('This will reprocess ALL sales data with current channel settings. Continue?')) {
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('reprocess-sales-channels', {
        body: {},
      });

      if (error) {
        console.error('Error reprocessing:', error);
        toast.error('Failed to reprocess sales channels');
        return;
      }

      setResult(data);

      if (data.success) {
        toast.success(`Successfully reprocessed ${data.processedCount} sales records`);
        await fetchSummary();
      } else {
        toast.error(`Reprocessing completed with ${data.errorCount} errors`);
      }
    } catch (error) {
      console.error('Error calling reprocess function:', error);
      toast.error('Failed to start reprocessing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Reprocess Historical Sales Data
        </CardTitle>
        <CardDescription>
          Apply current sales channel settings to all historical sales data. This will recalculate commission fees based on your current channel configurations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>What this does:</strong>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li>Applies current channel settings (All Teams configuration) to all past sales</li>
              <li>Recalculates commission fees based on current rates</li>
              <li>Generates channel transactions for sales that didn't have them</li>
              <li>Updates the Sales Channel Fees Breakdown for all teams</li>
            </ul>
          </AlertDescription>
        </Alert>

        {summary && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Total Sales Records</div>
              <div className="text-2xl font-bold">{summary.salesCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Transactions</div>
              <div className="text-2xl font-bold">{summary.existingTransactionCount}</div>
            </div>
            {summary.dateRange.start && (
              <div className="col-span-2">
                <div className="text-sm text-muted-foreground">Date Range</div>
                <div className="text-sm font-medium">
                  {format(new Date(summary.dateRange.start), 'MMM d, yyyy')} - {format(new Date(summary.dateRange.end), 'MMM d, yyyy')}
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  <strong>Reprocessing Results:</strong>
                </div>
                <div className="text-sm space-y-1">
                  <div>✓ Processed: {result.processedCount} sales records</div>
                  <div>✗ Errors: {result.errorCount}</div>
                  <div>💰 Total Fees Generated: ${result.totalFeesGenerated.toFixed(2)}</div>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">Errors:</div>
                    <ul className="list-disc list-inside">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={fetchSummary}
            variant="outline"
            disabled={isProcessing}
          >
            Load Summary
          </Button>
          <Button
            onClick={handleReprocess}
            disabled={isProcessing || !summary}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Reprocessing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Reprocess All Sales Data
              </>
            )}
          </Button>
        </div>

        <Alert variant="default" className="border-orange-500/50">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> This operation will:
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Delete all existing channel transactions</li>
              <li>Create new transactions based on current channel settings</li>
              <li>Take several seconds to complete depending on data volume</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

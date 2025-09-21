import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, FileSpreadsheet, File, TrendingUp, AlertTriangle, Users, DollarSign } from 'lucide-react';
import { useInventoryCountExport, InventoryExportType } from '@/hooks/useInventoryCountExport';
import { downloadCSV } from '@/utils/exportUtils';
import { useInventory } from '@/contexts/inventory';

interface InventoryExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countId?: string;
  teamId?: string;
}

export const InventoryExportDialog: React.FC<InventoryExportDialogProps> = ({
  open,
  onOpenChange,
  countId,
  teamId
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [exportType, setExportType] = useState<InventoryExportType>('detailed');
  const [varianceThreshold, setVarianceThreshold] = useState(5);
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeStockAnalysis, setIncludeStockAnalysis] = useState(true);

  const { 
    counts, 
    items: inventoryItems, 
    loading 
  } = useInventory();

  const exportData = useInventoryCountExport(
    counts,
    [], // countItems not available in context yet
    inventoryItems,
    {
      type: exportType,
      countId,
      teamId,
      varianceThreshold,
      includeFinancials,
      includeStockAnalysis
    }
  );

  const handleExport = () => {
    if (loading) return;

    try {
      const enhancedExportData = {
        filename: exportData.filename,
        headers: exportData.headers,
        rows: exportData.rows,
        metadata: {
          exportType: `Inventory ${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Report`,
          dateRange: exportData.metadata.countDate,
          filters: `Team: ${exportData.metadata.teamName}, Variance Threshold: ${varianceThreshold}%`,
          generatedAt: exportData.metadata.generatedAt,
          totalRecords: exportData.metadata.totalItems
        }
      };

      downloadCSV(enhancedExportData);
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getExportTypeIcon = (type: InventoryExportType) => {
    switch (type) {
      case 'detailed': return <FileText className="h-4 w-4" />;
      case 'summary': return <TrendingUp className="h-4 w-4" />;
      case 'exceptions': return <AlertTriangle className="h-4 w-4" />;
      case 'team-performance': return <Users className="h-4 w-4" />;
      case 'financial-impact': return <DollarSign className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv': return <File className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Inventory Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Type</Label>
            <Select value={exportType} onValueChange={(value: InventoryExportType) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Detailed Report</div>
                      <div className="text-xs text-muted-foreground">Complete item analysis with all data</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="summary">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Executive Summary</div>
                      <div className="text-xs text-muted-foreground">Key metrics and overview</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="exceptions">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Exception Report</div>
                      <div className="text-xs text-muted-foreground">Critical issues requiring attention</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="team-performance">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Team Performance</div>
                      <div className="text-xs text-muted-foreground">Count accuracy by team</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="financial-impact">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Financial Impact</div>
                      <div className="text-xs text-muted-foreground">Cost analysis and variance impact</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    CSV Data
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel Workbook
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Export Options</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeFinancials"
                  checked={includeFinancials}
                  onCheckedChange={(checked) => setIncludeFinancials(!!checked)}
                />
                <Label htmlFor="includeFinancials" className="text-sm">Include Financial Analysis</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeStockAnalysis"
                  checked={includeStockAnalysis}
                  onCheckedChange={(checked) => setIncludeStockAnalysis(!!checked)}
                />
                <Label htmlFor="includeStockAnalysis" className="text-sm">Include Stock Level Analysis</Label>
              </div>
            </div>

            {/* Variance Threshold */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Variance Threshold (%)</Label>
              <Select value={varianceThreshold.toString()} onValueChange={(value) => setVarianceThreshold(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1% - Very Strict</SelectItem>
                  <SelectItem value="5">5% - Standard</SelectItem>
                  <SelectItem value="10">10% - Relaxed</SelectItem>
                  <SelectItem value="15">15% - Liberal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Info */}
          {exportData.metadata && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-1">
              <div className="text-sm font-medium">Export Preview</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Items to export: {exportData.metadata.totalItems}</div>
                <div>Critical items: {exportData.metadata.criticalItems}</div>
                <div>Total variance cost: ${exportData.metadata.totalVarianceCost.toFixed(2)}</div>
                <div>Team: {exportData.metadata.teamName}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              className="flex-1 gap-2"
              disabled={loading}
            >
              {getFormatIcon(exportFormat)}
              Export Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
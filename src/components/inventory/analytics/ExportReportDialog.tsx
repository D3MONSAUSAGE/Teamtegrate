import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AnalyticsMetrics, ChartData } from '@/hooks/useInventoryAnalytics';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: AnalyticsMetrics;
  chartData: ChartData;
}

export const ExportReportDialog: React.FC<ExportReportDialogProps> = ({
  open,
  onOpenChange,
  metrics,
  chartData
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedSections, setSelectedSections] = useState({
    metrics: true,
    completionTrends: true,
    varianceAnalysis: true,
    teamPerformance: true,
    categoryBreakdown: true,
    alertTrends: true
  });

  const handleSectionChange = (section: keyof typeof selectedSections, checked: boolean) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: checked
    }));
  };

  const handleExport = () => {
    // Mock export functionality - in real implementation, this would generate and download the report
    const selectedData = {
      format: exportFormat,
      sections: selectedSections,
      metrics,
      chartData
    };
    
    console.log('Exporting report:', selectedData);
    
    // Simulate download
    const filename = `inventory-analytics-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    
    // Create mock download
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    onOpenChange(false);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv': return <File className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel' | 'csv') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel Workbook
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    CSV Data
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Report Sections */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include Sections</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metrics"
                  checked={selectedSections.metrics}
                  onCheckedChange={(checked) => handleSectionChange('metrics', !!checked)}
                />
                <Label htmlFor="metrics" className="text-sm">Key Performance Metrics</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="completionTrends"
                  checked={selectedSections.completionTrends}
                  onCheckedChange={(checked) => handleSectionChange('completionTrends', !!checked)}
                />
                <Label htmlFor="completionTrends" className="text-sm">Completion Trends</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="varianceAnalysis"
                  checked={selectedSections.varianceAnalysis}
                  onCheckedChange={(checked) => handleSectionChange('varianceAnalysis', !!checked)}
                />
                <Label htmlFor="varianceAnalysis" className="text-sm">Variance Analysis</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="teamPerformance"
                  checked={selectedSections.teamPerformance}
                  onCheckedChange={(checked) => handleSectionChange('teamPerformance', !!checked)}
                />
                <Label htmlFor="teamPerformance" className="text-sm">Team Performance</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="categoryBreakdown"
                  checked={selectedSections.categoryBreakdown}
                  onCheckedChange={(checked) => handleSectionChange('categoryBreakdown', !!checked)}
                />
                <Label htmlFor="categoryBreakdown" className="text-sm">Category Breakdown</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="alertTrends"
                  checked={selectedSections.alertTrends}
                  onCheckedChange={(checked) => handleSectionChange('alertTrends', !!checked)}
                />
                <Label htmlFor="alertTrends" className="text-sm">Alert Trends</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleExport} className="flex-1 gap-2">
              {getFormatIcon(exportFormat)}
              Export Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
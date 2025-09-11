import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';
import { ReportPreview } from '@/services/ReportService';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: ReportPreview | null;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  preview,
  onGenerate,
  isGenerating
}) => {
  if (!preview) return null;

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-emerald-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Report Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{preview.title}</h2>
            <p className="text-muted-foreground">{preview.summary}</p>
          </div>

          {/* Key Metrics */}
          {preview.keyMetrics && preview.keyMetrics.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Key Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preview.keyMetrics.map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            {metric.label}
                          </p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold">
                              {metric.value}
                            </span>
                            {metric.change && (
                              <div className={`flex items-center gap-1 text-sm ${getTrendColor(metric.trend)}`}>
                                {getTrendIcon(metric.trend)}
                                {metric.change}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {preview.insights && preview.insights.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">What's Included</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {preview.insights.map((insight, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
                    <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart Preview */}
          {preview.chartData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Visual Analytics</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Charts & Visualizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Charts will be included in the full report</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Report Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Report Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">PDF Format</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Visual Charts</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Trend Analysis</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/20">
                <Download className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Downloadable</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              <Eye className="w-4 h-4 mr-2" />
              Close Preview
            </Button>
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
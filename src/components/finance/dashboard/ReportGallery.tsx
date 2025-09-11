import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Search,
  Filter,
  Eye,
  Star,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';

interface ReportGalleryProps {
  onBackToDashboard: () => void;
  onNavigateToAnalytics: () => void;
}

const ReportGallery: React.FC<ReportGalleryProps> = ({ 
  onBackToDashboard, 
  onNavigateToAnalytics 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const reportCategories = [
    { id: 'all', label: 'All Reports', count: 12 },
    { id: 'sales', label: 'Sales Reports', count: 5 },
    { id: 'financial', label: 'Financial Reports', count: 4 },
    { id: 'analytics', label: 'Analytics', count: 3 }
  ];

  const reportTemplates = [
    {
      id: 1,
      title: 'Weekly Sales Summary',
      description: 'Complete overview of weekly sales performance with key metrics',
      category: 'sales',
      type: 'summary',
      icon: BarChart3,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      popular: true,
      generateTime: '2 mins',
      lastGenerated: '2 hours ago',
      features: ['Revenue breakdown', 'Trend analysis', 'Location comparison']
    },
    {
      id: 2,
      title: 'Monthly P&L Statement',
      description: 'Detailed profit and loss statement for monthly reporting',
      category: 'financial',
      type: 'detailed',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      popular: true,
      generateTime: '5 mins',
      lastGenerated: '1 day ago',
      features: ['Income statement', 'Expense tracking', 'Margin analysis']
    },
    {
      id: 3,
      title: 'Daily Sales Dashboard',
      description: 'Real-time daily sales metrics and performance indicators',
      category: 'analytics',
      type: 'dashboard',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      popular: false,
      generateTime: '1 min',
      lastGenerated: '30 mins ago',
      features: ['Live metrics', 'Hourly breakdown', 'Staff performance']
    },
    {
      id: 4,
      title: 'Sales Trends Analysis',
      description: 'Advanced analytics showing sales patterns and forecasts',
      category: 'analytics',
      type: 'analysis',
      icon: LineChart,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      popular: false,
      generateTime: '3 mins',
      lastGenerated: '4 hours ago',
      features: ['Trend forecasting', 'Seasonal patterns', 'Growth metrics']
    },
    {
      id: 5,
      title: 'Payment Methods Report',
      description: 'Breakdown of payment methods and transaction types',
      category: 'sales',
      type: 'breakdown',
      icon: PieChart,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      popular: true,
      generateTime: '2 mins',
      lastGenerated: '6 hours ago',
      features: ['Payment breakdown', 'Cash vs card', 'Tips analysis']
    },
    {
      id: 6,
      title: 'Tax Summary Report',
      description: 'Comprehensive tax information for compliance reporting',
      category: 'financial',
      type: 'compliance',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      popular: false,
      generateTime: '4 mins',
      lastGenerated: '1 week ago',
      features: ['Tax calculations', 'Compliance ready', 'Export formats']
    }
  ];

  const filteredReports = reportTemplates.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGenerateReport = async (reportId: number) => {
    try {
      const { reportService } = await import('@/services/ReportService');
      const template = reportService.getReportTemplates().find(t => t.id === reportId);
      if (template) {
        const blob = await template.generateFunction();
        const { exportService } = await import('@/services/ExportService');
        exportService.downloadBlob(blob, exportService.generateFilename(template.title, 'pdf'));
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handlePreviewReport = async (reportId: number) => {
    try {
      const { reportService } = await import('@/services/ReportService');
      const template = reportService.getReportTemplates().find(t => t.id === reportId);
      if (template) {
        const preview = await template.previewFunction();
        console.log('Report preview:', preview);
        // Show preview modal here
      }
    } catch (error) {
      console.error('Error previewing report:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={onBackToDashboard}
            className="mb-4 -ml-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Report Gallery</h1>
          <p className="text-muted-foreground">Choose from pre-built report templates or create custom analytics</p>
        </div>
        <Button onClick={onNavigateToAnalytics} className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Custom Analytics
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {reportCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  size="sm"
                  className="gap-2"
                >
                  {category.label}
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Reports */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Popular Reports</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredReports.filter(report => report.popular).map((report) => (
            <Card key={report.id} className="glass-card border-0 hover:shadow-lg transition-all duration-200 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${report.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <report.icon className={`w-6 h-6 ${report.color}`} />
                  </div>
                  <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border-amber-300">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {report.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.generateTime}
                    </div>
                    <span>Last: {report.lastGenerated}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handlePreviewReport(report.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleGenerateReport(report.id)}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* All Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.filter(report => !report.popular).map((report) => (
            <Card key={report.id} className="glass-card border-0 hover:shadow-lg transition-all duration-200 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${report.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <report.icon className={`w-6 h-6 ${report.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {report.type}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {report.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.generateTime}
                    </div>
                    <span>Last: {report.lastGenerated}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handlePreviewReport(report.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleGenerateReport(report.id)}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportGallery;
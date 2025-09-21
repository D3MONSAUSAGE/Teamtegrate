import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  PieChart,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Share,
  Mail,
  Settings,
  Filter,
  RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'analytical' | 'comparative';
  icon: any;
  estimatedTime: string;
  complexity: 'simple' | 'moderate' | 'complex';
  requiredData: string[];
  outputFormats: ('pdf' | 'excel' | 'csv' | 'json' | 'dashboard')[];
}

interface ReportConfig {
  templateId: string;
  dateRange: DateRange;
  teamIds: string[];
  format: string;
  customOptions: Record<string, any>;
  includeCharts: boolean;
  includeInsights: boolean;
  scheduleDelivery?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

interface ReportJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  estimatedCompletion?: Date;
  downloadUrl?: string;
  error?: string;
}

interface ComprehensiveReportGeneratorProps {
  availableTeams?: Array<{ id: string; name: string }>;
  onGenerateReport: (config: ReportConfig) => Promise<string>;
  onScheduleReport?: (config: ReportConfig) => Promise<void>;
  recentJobs?: ReportJob[];
}

export const ComprehensiveReportGenerator: React.FC<ComprehensiveReportGeneratorProps> = ({
  availableTeams = [],
  onGenerateReport,
  onScheduleReport,
  recentJobs = []
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportConfig, setReportConfig] = useState<Partial<ReportConfig>>({
    teamIds: [],
    includeCharts: true,
    includeInsights: true,
    customOptions: {}
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeJobs, setActiveJobs] = useState<ReportJob[]>([]);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'financial-summary',
      name: 'Financial Summary Report',
      description: 'Comprehensive overview of revenue, expenses, and profitability',
      category: 'financial',
      icon: DollarSign,
      estimatedTime: '2-3 min',
      complexity: 'simple',
      requiredData: ['sales', 'expenses', 'payments'],
      outputFormats: ['pdf', 'excel', 'csv']
    },
    {
      id: 'sales-performance',
      name: 'Sales Performance Analysis',
      description: 'Deep dive into sales trends, team performance, and growth metrics',
      category: 'analytical',
      icon: TrendingUp,
      estimatedTime: '3-5 min',
      complexity: 'moderate',
      requiredData: ['sales', 'teams', 'products'],
      outputFormats: ['pdf', 'excel', 'dashboard']
    },
    {
      id: 'operational-efficiency',
      name: 'Operational Efficiency Report',
      description: 'Labor costs, productivity metrics, and operational insights',
      category: 'operational',
      icon: BarChart3,
      estimatedTime: '4-6 min',
      complexity: 'complex',
      requiredData: ['sales', 'labor', 'inventory', 'teams'],
      outputFormats: ['pdf', 'excel']
    },
    {
      id: 'team-comparison',
      name: 'Team Comparison Report',
      description: 'Side-by-side analysis of team performance and benchmarks',
      category: 'comparative',
      icon: Users,
      estimatedTime: '3-4 min',
      complexity: 'moderate',
      requiredData: ['sales', 'teams', 'schedules'],
      outputFormats: ['pdf', 'excel', 'dashboard']
    },
    {
      id: 'customer-insights',
      name: 'Customer Insights Report',
      description: 'Customer behavior, preferences, and loyalty analysis',
      category: 'analytical',
      icon: PieChart,
      estimatedTime: '5-7 min',
      complexity: 'complex',
      requiredData: ['sales', 'customers', 'products'],
      outputFormats: ['pdf', 'excel', 'csv']
    },
    {
      id: 'monthly-executive',
      name: 'Executive Monthly Summary',
      description: 'High-level KPIs and strategic insights for leadership',
      category: 'financial',
      icon: FileText,
      estimatedTime: '2-3 min',
      complexity: 'simple',
      requiredData: ['sales', 'expenses', 'teams', 'goals'],
      outputFormats: ['pdf', 'dashboard']
    },
    {
      id: 'predictive-forecast',
      name: 'Predictive Forecast Report',
      description: 'AI-powered sales forecasting and trend predictions',
      category: 'analytical',
      icon: TrendingUp,
      estimatedTime: '6-8 min',
      complexity: 'complex',
      requiredData: ['sales', 'historical', 'seasonality'],
      outputFormats: ['pdf', 'excel', 'json']
    },
    {
      id: 'cost-analysis',
      name: 'Cost Analysis & Optimization',
      description: 'Detailed cost breakdown and optimization recommendations',
      category: 'financial',
      icon: BarChart3,
      estimatedTime: '4-5 min',
      complexity: 'moderate',
      requiredData: ['expenses', 'sales', 'inventory', 'labor'],
      outputFormats: ['pdf', 'excel']
    }
  ];

  const outputFormats = [
    { id: 'pdf', name: 'PDF Report', description: 'Formatted document with charts' },
    { id: 'excel', name: 'Excel Workbook', description: 'Interactive spreadsheet with data' },
    { id: 'csv', name: 'CSV Data', description: 'Raw data for external analysis' },
    { id: 'json', name: 'JSON Export', description: 'Structured data for API integration' },
    { id: 'dashboard', name: 'Live Dashboard', description: 'Interactive web dashboard' }
  ];

  const selectedTemplateData = reportTemplates.find(t => t.id === selectedTemplate);

  const updateConfig = (updates: Partial<ReportConfig>) => {
    setReportConfig(prev => ({ ...prev, ...updates }));
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplateData || !reportConfig.dateRange?.from || !reportConfig.format) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const config: ReportConfig = {
        templateId: selectedTemplate,
        dateRange: reportConfig.dateRange,
        teamIds: reportConfig.teamIds || [],
        format: reportConfig.format || 'pdf',
        customOptions: reportConfig.customOptions || {},
        includeCharts: reportConfig.includeCharts ?? true,
        includeInsights: reportConfig.includeInsights ?? true,
        scheduleDelivery: reportConfig.scheduleDelivery
      };

      const jobId = await onGenerateReport(config);
      
      // Add to active jobs
      const newJob: ReportJob = {
        id: jobId,
        name: selectedTemplateData.name,
        status: 'running',
        progress: 100,
        startTime: new Date()
      };
      
      setActiveJobs(prev => [newJob, ...prev]);
      setGenerationProgress(100);
      
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Report generation failed:', error);
      setIsGenerating(false);
      setGenerationProgress(0);
    }

    clearInterval(progressInterval);
  };

  const getComplexityColor = (complexity: ReportTemplate['complexity']) => {
    switch (complexity) {
      case 'simple': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'complex': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: ReportTemplate['category']) => {
    switch (category) {
      case 'financial': return DollarSign;
      case 'operational': return BarChart3;
      case 'analytical': return TrendingUp;
      case 'comparative': return Users;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: ReportTemplate['category']) => {
    switch (category) {
      case 'financial': return 'text-emerald-600 bg-emerald-100';
      case 'operational': return 'text-blue-600 bg-blue-100';
      case 'analytical': return 'text-purple-600 bg-purple-100';
      case 'comparative': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateRange = () => {
    if (!reportConfig.dateRange?.from) return 'Select date range';
    if (!reportConfig.dateRange?.to) return format(reportConfig.dateRange.from, 'MMM dd, yyyy');
    return `${format(reportConfig.dateRange.from, 'MMM dd, yyyy')} - ${format(reportConfig.dateRange.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Comprehensive Report Generator
          </CardTitle>
          <p className="text-muted-foreground">
            Generate detailed business reports with advanced analytics and insights
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="configure">Configure & Generate</TabsTrigger>
          <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose Report Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map(template => {
                  const CategoryIcon = getCategoryIcon(template.category);
                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <template.icon className="h-6 w-6 text-primary" />
                          <div className="flex gap-1">
                            <Badge className={`text-xs ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </Badge>
                            <Badge className={`text-xs ${getComplexityColor(template.complexity)}`}>
                              {template.complexity}
                            </Badge>
                          </div>
                        </div>
                        
                        <h4 className="font-semibold text-sm mb-2">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{template.estimatedTime}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {template.outputFormats.slice(0, 3).map(format => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format.toUpperCase()}
                              </Badge>
                            ))}
                            {template.outputFormats.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.outputFormats.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          {selectedTemplateData ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <selectedTemplateData.icon className="h-5 w-5" />
                    {selectedTemplateData.name}
                  </CardTitle>
                  <p className="text-muted-foreground">{selectedTemplateData.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range *</label>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDateRange()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Selection */}
                  {availableTeams.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Teams</label>
                      <Select
                        value={reportConfig.teamIds?.[0] || 'all'}
                        onValueChange={(value) => updateConfig({ teamIds: value && value !== 'all' ? [value] : [] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Teams</SelectItem>
                          {availableTeams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Output Format */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Output Format *</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {outputFormats
                        .filter(format => selectedTemplateData.outputFormats.includes(format.id as any))
                        .map(format => (
                          <div
                            key={format.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              reportConfig.format === format.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => updateConfig({ format: format.id })}
                          >
                            <div className="font-medium text-sm">{format.name}</div>
                            <div className="text-xs text-muted-foreground">{format.description}</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Report Options</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={reportConfig.includeCharts ?? true}
                          onChange={(e) => updateConfig({ includeCharts: e.target.checked })}
                        />
                        <span className="text-sm">Include charts and visualizations</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={reportConfig.includeInsights ?? true}
                          onChange={(e) => updateConfig({ includeInsights: e.target.checked })}
                        />
                        <span className="text-sm">Include AI-powered insights</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generation Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Ready to Generate</h4>
                      <p className="text-sm text-muted-foreground">
                        Estimated time: {selectedTemplateData.estimatedTime}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={!reportConfig.dateRange?.from || !reportConfig.format}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={handleGenerateReport}
                        disabled={isGenerating || !reportConfig.dateRange?.from || !reportConfig.format}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </div>

                  {isGenerating && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Generating report...</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <Progress value={generationProgress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Select a Report Template</h3>
                <p className="text-muted-foreground">
                  Choose a report template from the Templates tab to begin configuration
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Report Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {activeJobs.length > 0 || recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {[...activeJobs, ...recentJobs].slice(0, 10).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {job.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : job.status === 'failed' ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : job.status === 'running' ? (
                          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        
                        <div>
                          <p className="font-medium text-sm">{job.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Started {job.startTime.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'failed' ? 'destructive' :
                          job.status === 'running' ? 'secondary' : 'outline'
                        }>
                          {job.status}
                        </Badge>
                        
                        {job.status === 'completed' && job.downloadUrl && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Recent Jobs</h3>
                  <p className="text-muted-foreground">
                    Generated reports will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
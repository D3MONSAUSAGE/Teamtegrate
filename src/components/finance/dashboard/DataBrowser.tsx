import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Search, 
  Filter, 
  Calendar,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Activity
} from 'lucide-react';
import { useSalesManager } from '@/hooks/useSalesManager';
import { format } from 'date-fns';

interface DataBrowserProps {
  onBackToDashboard: () => void;
}

const DataBrowser: React.FC<DataBrowserProps> = ({ onBackToDashboard }) => {
  const { salesData, weeklyData, isLoading } = useSalesManager();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');

  const timeRanges = [
    { id: 'all', label: 'All Time', count: salesData.length },
    { id: 'week', label: 'This Week', count: 7 },
    { id: 'month', label: 'This Month', count: 30 },
    { id: 'quarter', label: 'This Quarter', count: 90 }
  ];

  const dataQuality = {
    total: salesData.length,
    validated: salesData.filter(d => d.netSales > 0).length,
    errors: salesData.filter(d => d.netSales <= 0).length,
    duplicates: 0
  };

  const qualityPercentage = dataQuality.total > 0 
    ? Math.round((dataQuality.validated / dataQuality.total) * 100)
    : 0;

  const filteredData = salesData.filter(data => {
    const matchesSearch = data.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.date.includes(searchTerm);
    // Add time range filtering logic here if needed
    return matchesSearch;
  });

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
          <h1 className="text-2xl font-bold">Data Browser</h1>
          <p className="text-muted-foreground">View, manage and validate your financial data</p>
        </div>
      </div>

      {/* Data Health Overview */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Data Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{dataQuality.total}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validated</p>
                <p className="text-2xl font-bold text-emerald-600">{dataQuality.validated}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="text-2xl font-bold text-amber-600">{dataQuality.errors}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold text-blue-600">{qualityPercentage}%</p>
              </div>
            </div>
          </div>

          {qualityPercentage < 90 && (
            <div className="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-amber-800 font-medium">Data Quality Alert</p>
              </div>
              <p className="text-amber-700 text-sm mt-1">
                Some records have validation issues. Review and fix them for accurate reporting.
              </p>
              <Button size="sm" variant="outline" className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100">
                Review Issues
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by location or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {timeRanges.map((range) => (
                <Button
                  key={range.id}
                  variant={selectedTimeRange === range.id ? 'default' : 'outline'}
                  onClick={() => setSelectedTimeRange(range.id)}
                  size="sm"
                  className="gap-2"
                >
                  {range.label}
                  <Badge variant="secondary" className="text-xs">
                    {range.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Sales Data ({filteredData.length} records)
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filter
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No data found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Location</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Gross Sales</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Net Sales</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Total Cash</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 20).map((data, index) => (
                    <tr key={index} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(data.date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{data.location}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">
                        ${data.grossSales.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-medium">
                        ${data.netSales.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-medium">
                        ${data.paymentBreakdown.totalCash.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <Badge 
                          variant={data.netSales > 0 ? 'default' : 'destructive'}
                          className={data.netSales > 0 ? 'bg-emerald-100 text-emerald-700' : ''}
                        >
                          {data.netSales > 0 ? 'Valid' : 'Issue'}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length > 20 && (
                <div className="text-center py-4">
                  <Button variant="outline">
                    Load More ({filteredData.length - 20} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataBrowser;
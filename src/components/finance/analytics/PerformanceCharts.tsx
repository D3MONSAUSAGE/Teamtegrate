import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, ComposedChart } from 'recharts';
import { analyticsService } from '@/services/AnalyticsService';
import { SalesData } from '@/types/sales';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Zap, MapPin, Clock, Calculator } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface PerformanceChartsProps {
  salesData?: SalesData[];
  selectedTeam?: string;
  dateRange?: string;
}

interface LocationMetrics {
  location: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  laborCost: number;
  laborPercentage: number;
  efficiency: number;
  trend: number;
}

interface LaborTrend {
  date: string;
  cost: number;
  hours: number;
  percentage: number;
  revenue: number;
  efficiency: number;
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  salesData = [],
  selectedTeam = 'all',
  dateRange = '7d'
}) => {
  const [locationMetrics, setLocationMetrics] = useState<LocationMetrics[]>([]);
  const [laborTrends, setLaborTrends] = useState<LaborTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'efficiency' | 'labor'>('revenue');

  useEffect(() => {
    const loadPerformanceData = async () => {
      setIsLoading(true);
      
      try {
        // Calculate location metrics
        const locationStats = salesData.reduce((acc, sale) => {
          const location = sale.location || 'Unknown';
          
          if (!acc[location]) {
            acc[location] = {
              revenue: 0,
              orders: 0,
              laborCost: 0,
              laborHours: 0,
              records: 0
            };
          }
          
          acc[location].revenue += sale.grossSales || 0;
          acc[location].orders += sale.orderCount || 0;
          acc[location].laborCost += sale.labor?.cost || 0;
          acc[location].laborHours += sale.labor?.hours || 0;
          acc[location].records += 1;
          
          return acc;
        }, {} as Record<string, any>);

        // Transform to metrics array
        const metrics: LocationMetrics[] = Object.entries(locationStats).map(([location, stats]) => {
          const avgOrderValue = stats.orders > 0 ? stats.revenue / stats.orders : 0;
          const laborPercentage = stats.revenue > 0 ? (stats.laborCost / stats.revenue) * 100 : 0;
          const salesPerHour = stats.laborHours > 0 ? stats.revenue / stats.laborHours : 0;
          const efficiency = salesPerHour > 100 ? 100 : salesPerHour; // Cap at 100 for display
          
          return {
            location,
            revenue: stats.revenue,
            orders: stats.orders,
            avgOrderValue,
            laborCost: stats.laborCost,
            laborPercentage,
            efficiency,
            trend: Math.random() * 20 - 10 // Mock trend for now
          };
        }).sort((a, b) => b.revenue - a.revenue);

        // Calculate labor trends over time
        const laborTrendData: LaborTrend[] = salesData
          .map(sale => ({
            date: sale.date,
            cost: sale.labor?.cost || 0,
            hours: sale.labor?.hours || 0,
            percentage: sale.labor?.percentage || 0,
            revenue: sale.grossSales || 0,
            efficiency: (sale.labor?.hours || 0) > 0 ? (sale.grossSales || 0) / (sale.labor?.hours || 0) : 0
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setLocationMetrics(metrics);
        setLaborTrends(laborTrendData);
      } catch (error) {
        console.error('Error loading performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [salesData, selectedTeam, dateRange]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getMetricColor = (value: number, type: 'trend' | 'efficiency' | 'labor') => {
    switch (type) {
      case 'trend':
        return value >= 0 ? '#10B981' : '#EF4444';
      case 'efficiency':
        return value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : '#EF4444';
      case 'labor':
        return value <= 25 ? '#10B981' : value <= 35 ? '#F59E0B' : '#EF4444';
      default:
        return '#6366F1';
    }
  };

  const pieColors = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#84CC16'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Location</p>
                <p className="text-lg font-semibold">{locationMetrics[0]?.location || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(locationMetrics[0]?.revenue || 0)}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Efficiency</p>
                <p className="text-lg font-semibold">
                  {locationMetrics.sort((a, b) => b.efficiency - a.efficiency)[0]?.location || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${(locationMetrics[0]?.efficiency || 0).toFixed(0)}/hr
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Labor %</p>
                <p className="text-lg font-semibold">
                  {formatPercentage(locationMetrics.reduce((sum, loc) => sum + loc.laborPercentage, 0) / (locationMetrics.length || 1))}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant={
                    (locationMetrics.reduce((sum, loc) => sum + loc.laborPercentage, 0) / (locationMetrics.length || 1)) <= 25 
                      ? 'default' 
                      : 'destructive'
                  } className="text-xs">
                    {(locationMetrics.reduce((sum, loc) => sum + loc.laborPercentage, 0) / (locationMetrics.length || 1)) <= 25 ? 'Good' : 'High'}
                  </Badge>
                </div>
              </div>
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Locations</p>
                <p className="text-lg font-semibold">{locationMetrics.length}</p>
                <p className="text-xs text-muted-foreground">Active locations</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Performance Charts */}
      <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue Comparison</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Analysis</TabsTrigger>
          <TabsTrigger value="labor">Labor Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue by Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationMetrics.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="location" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Order Volume Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={locationMetrics.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="orders"
                        label={({ location, orders }) => `${location}: ${orders}`}
                        labelLine={false}
                      >
                        {locationMetrics.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Orders']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Location Efficiency Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationMetrics.slice(0, 8).map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{location.location}</p>
                          <p className="text-sm text-muted-foreground">
                            ${location.efficiency.toFixed(0)} sales/hour
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={location.efficiency >= 80 ? 'default' : location.efficiency >= 60 ? 'secondary' : 'destructive'}
                        >
                          {location.efficiency >= 80 ? 'High' : location.efficiency >= 60 ? 'Medium' : 'Low'}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(location.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Efficiency vs Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={locationMetrics.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="location" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="revenue" fill="#6366F1" name="Revenue" />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="Efficiency"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="labor" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Labor Cost Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={laborTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value, name) => [
                          name === 'cost' ? formatCurrency(Number(value)) : value,
                          name === 'cost' ? 'Labor Cost' : 'Labor %'
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.3}
                        name="cost"
                      />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="#F59E0B"
                        fill="#F59E0B"
                        fillOpacity={0.3}
                        name="percentage"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Labor Percentage by Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationMetrics.slice(0, 8)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis 
                        type="category" 
                        dataKey="location" 
                        tick={{ fontSize: 12 }}
                        width={80}
                      />
                      <Tooltip 
                        formatter={(value) => [formatPercentage(Number(value)), 'Labor %']}
                      />
                      <Bar 
                        dataKey="laborPercentage" 
                        radius={[0, 4, 4, 0]}
                        fill="#6366F1"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceCharts;
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight, TrendingUp, MapPin, Download } from "lucide-react";
import { format, startOfWeek, parseISO } from 'date-fns';
import { WeeklySalesData, ParsedSalesData } from '@/types/sales';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from '@/components/ui/sonner';

interface WeeklyDetailedReportProps {
  weeklyData: WeeklySalesData | null;
  selectedWeek: Date;
  setSelectedWeek: (week: Date) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  locations: string[];
  weeksWithData: Date[];
  salesData: ParsedSalesData[];
  isLoading: boolean;
}

const WeeklyDetailedReport: React.FC<WeeklyDetailedReportProps> = ({
  weeklyData,
  selectedWeek,
  setSelectedWeek,
  selectedLocation,
  setSelectedLocation,
  locations,
  weeksWithData,
  salesData,
  isLoading
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter sales data for the selected week and location
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const filteredWeekData = salesData.filter(item => {
    const itemDate = typeof item.date === 'string' ? parseISO(item.date) : item.date;
    const locationMatch = selectedLocation === 'all' || item.location === selectedLocation;
    return itemDate >= weekStart && itemDate <= weekEnd && locationMatch;
  });

  // Aggregate data for different views
  const dailyData = filteredWeekData.reduce((acc, item) => {
    const date = format(typeof item.date === 'string' ? parseISO(item.date) : item.date, 'MMM dd');
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.grossSales += item.grossSales || 0;
      existing.netSales += item.netSales || 0;
      existing.orders += item.orderCount || 0;
    } else {
      acc.push({
        date,
        grossSales: item.grossSales || 0,
        netSales: item.netSales || 0,
        orders: item.orderCount || 0
      });
    }
    return acc;
  }, [] as any[]);

  // Destinations data
  const destinationData = filteredWeekData.reduce((acc, item) => {
    if (item.destinations) {
      item.destinations.forEach(dest => {
        const existing = acc.find(d => d.name === dest.name);
        if (existing) {
          existing.sales += dest.netSales || 0;
          existing.quantity += dest.quantity || 0;
        } else {
          acc.push({
            name: dest.name,
            sales: dest.netSales || 0,
            quantity: dest.quantity || 0
          });
        }
      });
    }
    return acc;
  }, [] as any[]).sort((a, b) => b.sales - a.sales);

  // Revenue Items data
  const revenueItemData = filteredWeekData.reduce((acc, item) => {
    if (item.revenueItems) {
      item.revenueItems.forEach(revenue => {
        const existing = acc.find(r => r.name === revenue.name);
        if (existing) {
          existing.sales += revenue.netSales || 0;
          existing.quantity += revenue.quantity || 0;
        } else {
          acc.push({
            name: revenue.name,
            sales: revenue.netSales || 0,
            quantity: revenue.quantity || 0
          });
        }
      });
    }
    return acc;
  }, [] as any[]).sort((a, b) => b.sales - a.sales).slice(0, 10);

  // Payment Methods data
  const paymentMethodData = filteredWeekData.reduce((acc, item) => {
    if (item.tenders) {
      item.tenders.forEach(tender => {
        const existing = acc.find(t => t.name === tender.name);
        if (existing) {
          existing.amount += tender.amount || 0;
          existing.quantity += tender.quantity || 0;
        } else {
          acc.push({
            name: tender.name,
            amount: tender.amount || 0,
            quantity: tender.quantity || 0
          });
        }
      });
    }
    return acc;
  }, [] as any[]).sort((a, b) => b.amount - a.amount);

  // Discounts and Taxes data
  const discountsData = filteredWeekData.reduce((acc, item) => {
    if (item.discounts) {
      item.discounts.forEach(discount => {
        const existing = acc.find(d => d.name === discount.name);
        if (existing) {
          existing.amount += discount.amount || 0;
          existing.quantity += discount.quantity || 0;
        } else {
          acc.push({
            name: discount.name,
            amount: discount.amount || 0,
            quantity: discount.quantity || 0
          });
        }
      });
    }
    return acc;
  }, [] as any[]).sort((a, b) => b.amount - a.amount);

  const taxesData = filteredWeekData.reduce((acc, item) => {
    if (item.taxes) {
      item.taxes.forEach(tax => {
        const existing = acc.find(t => t.name === tax.name);
        if (existing) {
          existing.amount += tax.amount || 0;
        } else {
          acc.push({
            name: tax.name,
            amount: tax.amount || 0
          });
        }
      });
    }
    return acc;
  }, [] as any[]).sort((a, b) => b.amount - a.amount);

  const totals = filteredWeekData.reduce((acc, item) => ({
    grossSales: acc.grossSales + (item.grossSales || 0),
    netSales: acc.netSales + (item.netSales || 0),
    orders: acc.orders + (item.orderCount || 0),
    averageOrder: 0
  }), { grossSales: 0, netSales: 0, orders: 0, averageOrder: 0 });

  totals.averageOrder = totals.orders > 0 ? totals.netSales / totals.orders : 0;

  const handlePreviousWeek = () => {
    const currentIndex = weeksWithData.findIndex(week => 
      format(week, 'yyyy-MM-dd') === format(selectedWeek, 'yyyy-MM-dd')
    );
    if (currentIndex > 0) {
      setSelectedWeek(weeksWithData[currentIndex - 1]);
    }
  };

  const handleNextWeek = () => {
    const currentIndex = weeksWithData.findIndex(week => 
      format(week, 'yyyy-MM-dd') === format(selectedWeek, 'yyyy-MM-dd')
    );
    if (currentIndex < weeksWithData.length - 1) {
      setSelectedWeek(weeksWithData[currentIndex + 1]);
    }
  };

  const handleCurrentWeek = () => {
    if (weeksWithData.length > 0) {
      setSelectedWeek(weeksWithData[weeksWithData.length - 1]);
    }
  };

  const handleExportReport = () => {
    if (!weeklyData) return;
    
    const csvData = [
      ['Weekly Detailed Sales Report'],
      [`Week: ${format(selectedWeek, 'MMM dd, yyyy')} - ${format(weekEnd, 'MMM dd, yyyy')}`],
      [`Location: ${selectedLocation === 'all' ? 'All Locations' : selectedLocation}`],
      [''],
      ['Summary'],
      ['Metric', 'Value'],
      ['Gross Sales', formatCurrency(totals.grossSales)],
      ['Net Sales', formatCurrency(totals.netSales)],
      ['Total Orders', totals.orders.toString()],
      ['Average Order', formatCurrency(totals.averageOrder)],
      [''],
      ['Daily Breakdown'],
      ['Date', 'Gross Sales', 'Net Sales', 'Orders'],
      ...dailyData.map(day => [
        day.date,
        formatCurrency(day.grossSales),
        formatCurrency(day.netSales),
        day.orders.toString()
      ]),
      [''],
      ['Sales by Destination'],
      ['Destination', 'Net Sales', 'Quantity'],
      ...destinationData.map(dest => [
        dest.name,
        formatCurrency(dest.sales),
        dest.quantity.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `weekly-detailed-report-${format(selectedWeek, 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Weekly report exported successfully');
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!weeklyData || filteredWeekData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sales Data Found</h3>
            <p className="text-muted-foreground mb-4">
              No sales data available for the selected week and location.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Try:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Selecting a different week with available data</li>
                <li>• Changing the location filter to "All Locations"</li>
                <li>• Uploading sales data for this time period</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Weekly Detailed Report</h3>
          <p className="text-sm text-muted-foreground">
            In-depth analysis for {format(selectedWeek, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={handlePreviousWeek} 
                variant="outline" 
                size="sm"
                disabled={weeksWithData.findIndex(week => 
                  format(week, 'yyyy-MM-dd') === format(selectedWeek, 'yyyy-MM-dd')
                ) === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <Select 
                value={format(selectedWeek, 'yyyy-MM-dd')} 
                onValueChange={(value) => setSelectedWeek(new Date(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeksWithData.map((week) => (
                    <SelectItem key={format(week, 'yyyy-MM-dd')} value={format(week, 'yyyy-MM-dd')}>
                      {format(week, 'MMM dd, yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleNextWeek} 
                variant="outline" 
                size="sm"
                disabled={weeksWithData.findIndex(week => 
                  format(week, 'yyyy-MM-dd') === format(selectedWeek, 'yyyy-MM-dd')
                ) === weeksWithData.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button onClick={handleCurrentWeek} variant="outline" size="sm">
                Current Week
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location === 'all' ? 'All Locations' : location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gross Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.grossSales)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.netSales)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{totals.orders}</p>
              </div>
              <Badge variant="secondary">{filteredWeekData.length} days</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.averageOrder)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
              <TabsTrigger value="destinations">Destinations</TabsTrigger>
              <TabsTrigger value="items">Revenue Items</TabsTrigger>
              <TabsTrigger value="payments">Payment Methods</TabsTrigger>
              <TabsTrigger value="discounts">Discounts & Taxes</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Daily Sales Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="netSales" fill="hsl(var(--chart-1))" name="Net Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="destinations" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Sales Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={destinationData.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="sales"
                          nameKey="name"
                        >
                          {destinationData.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Sales by Destination</h4>
                  <div className="space-y-2">
                    {destinationData.map((destination, index) => (
                      <div key={destination.name} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                        <span className="font-medium">{destination.name}</span>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(destination.sales)}</div>
                          <div className="text-sm text-muted-foreground">{destination.quantity} orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Top Revenue Items</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueItemData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="sales" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Payment Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="amount"
                          nameKey="name"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Payment Methods</h4>
                  <div className="space-y-2">
                    {paymentMethodData.map((payment, index) => (
                      <div key={payment.name} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                        <span className="font-medium">{payment.name}</span>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                          <div className="text-sm text-muted-foreground">{payment.quantity} transactions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="discounts" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Discounts Applied</h4>
                  <div className="space-y-2">
                    {discountsData.length > 0 ? discountsData.map((discount, index) => (
                      <div key={discount.name} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                        <span className="font-medium">{discount.name}</span>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">-{formatCurrency(Math.abs(discount.amount))}</div>
                          <div className="text-sm text-muted-foreground">{discount.quantity} applied</div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">No discounts applied this week</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Taxes Collected</h4>
                  <div className="space-y-2">
                    {taxesData.length > 0 ? taxesData.map((tax, index) => (
                      <div key={tax.name} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                        <span className="font-medium">{tax.name}</span>
                        <div className="font-semibold">{formatCurrency(tax.amount)}</div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">No tax data available</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyDetailedReport;
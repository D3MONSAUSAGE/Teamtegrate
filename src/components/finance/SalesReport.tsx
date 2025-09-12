import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from 'date-fns';
import { ParsedSalesData } from '@/types/sales';

interface SalesReportProps {
  data: ParsedSalesData[];
  startDate: Date;
  endDate: Date;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const SalesReport: React.FC<SalesReportProps> = ({ data, startDate, endDate }) => {
  // Calculate daily totals
  const dailyData = useMemo(() => {
    return data.map(day => ({
      date: format(day.date, 'MMM dd'),
      grossSales: day.grossSales,
      netSales: day.netSales,
      orderCount: day.orderCount
    }));
  }, [data]);
  
  // Calculate destination totals
  const destinationData = useMemo(() => {
    const destinations: Record<string, { total: number, quantity: number }> = {};
    
    data.forEach(day => {
      day.destinations.forEach(dest => {
        if (!destinations[dest.name]) {
          destinations[dest.name] = { total: 0, quantity: 0 };
        }
        destinations[dest.name].total += dest.total;
        destinations[dest.name].quantity += dest.quantity;
      });
    });
    
    return Object.entries(destinations).map(([name, values]) => ({
      name,
      value: values.total,
      quantity: values.quantity
    })).sort((a, b) => b.value - a.value);
  }, [data]);
  
  // Calculate revenue item totals
  const revenueItemData = useMemo(() => {
    const items: Record<string, { total: number, quantity: number }> = {};
    
    data.forEach(day => {
      day.revenueItems.forEach(item => {
        if (!items[item.name]) {
          items[item.name] = { total: 0, quantity: 0 };
        }
        items[item.name].total += item.total;
        items[item.name].quantity += item.quantity;
      });
    });
    
    return Object.entries(items).map(([name, values]) => ({
      name,
      value: values.total,
      quantity: values.quantity
    })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [data]);
  
  // Calculate payment method totals
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, { total: number, quantity: number }> = {};
    
    data.forEach(day => {
      day.tenders.forEach(tender => {
        if (!methods[tender.name]) {
          methods[tender.name] = { total: 0, quantity: 0 };
        }
        methods[tender.name].total += tender.total;
        methods[tender.name].quantity += tender.quantity;
      });
    });
    
    return Object.entries(methods).map(([name, values]) => ({
      name,
      value: values.total,
      quantity: values.quantity
    })).sort((a, b) => b.value - a.value);
  }, [data]);
  
  // Aggregate Discounts & Taxes across range
  const discountsData = useMemo(() => {
    const map: Record<string, { total: number; quantity: number }> = {};
    data.forEach(day => {
      day.discounts.forEach(d => {
        if (!map[d.name]) map[d.name] = { total: 0, quantity: 0 };
        map[d.name].total += d.total;
        map[d.name].quantity += d.quantity;
      });
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, value: v.total, quantity: v.quantity }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const taxesData = useMemo(() => {
    const map: Record<string, { total: number; quantity: number }> = {};
    data.forEach(day => {
      day.taxes.forEach(t => {
        if (!map[t.name]) map[t.name] = { total: 0, quantity: 0 };
        map[t.name].total += t.total;
        map[t.name].quantity += t.quantity;
      });
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, value: v.total, quantity: v.quantity }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Calculate totals across all days
  const totals = useMemo(() => {
    if (data.length === 0) return { grossSales: 0, netSales: 0, orderCount: 0, orderAverage: 0 };
    
    const sums = data.reduce((acc, day) => {
      return {
        grossSales: acc.grossSales + day.grossSales,
        netSales: acc.netSales + day.netSales,
        orderCount: acc.orderCount + day.orderCount
      };
    }, { grossSales: 0, netSales: 0, orderCount: 0 });
    
    return {
      ...sums,
      orderAverage: sums.orderCount > 0 ? sums.netSales / sums.orderCount : 0
    };
  }, [data]);
  
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <p className="text-lg font-medium text-gray-600">No sales data available for the selected date range.</p>
          <p className="text-sm text-gray-500 mt-2">Try selecting a different date range or upload new data.</p>
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.grossSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.netSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.orderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Order</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.orderAverage)}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="destinations">Sales by Destination</TabsTrigger>
          <TabsTrigger value="items">Top Items</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="discounts">Discounts & Taxes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="grossSales" name="Gross Sales" fill="#8884d8" />
                    <Bar dataKey="netSales" name="Net Sales" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="destinations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Destination</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={destinationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                         label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {destinationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Destination Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destination</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {destinationData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="items">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Revenue Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueItemData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueItemData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="payments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethodData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="discounts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Discounts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Discount</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discountsData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tax</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxesData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesReport;

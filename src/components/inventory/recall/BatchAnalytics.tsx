import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export const BatchAnalytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalManufactured: 0,
    totalDistributed: 0,
    averageUtilization: 0,
  });
  const [productionByLine, setProductionByLine] = useState<any[]>([]);
  const [batchStatus, setBatchStatus] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get all batches
      const { data: batches, error } = await supabase
        .from('manufacturing_batches')
        .select('*');

      if (error) throw error;

      if (batches) {
        // Calculate overall stats
        const totalManufactured = batches.reduce((sum, b) => sum + b.total_quantity_manufactured, 0);
        const totalDistributed = batches.reduce((sum, b) => sum + b.quantity_distributed, 0);
        const averageUtilization = totalManufactured > 0 ? (totalDistributed / totalManufactured) * 100 : 0;

        setStats({
          totalBatches: batches.length,
          totalManufactured,
          totalDistributed,
          averageUtilization: Math.round(averageUtilization),
        });

        // Production by line
        const lineData = batches.reduce((acc: any, batch) => {
          const line = batch.production_line || 'Unassigned';
          if (!acc[line]) {
            acc[line] = { name: line, quantity: 0 };
          }
          acc[line].quantity += batch.total_quantity_manufactured;
          return acc;
        }, {});
        setProductionByLine(Object.values(lineData));

        // Batch status distribution
        const statusData = batches.reduce((acc: any, batch) => {
          const remaining = batch.quantity_remaining;
          const labeled = batch.quantity_labeled;
          const distributed = batch.quantity_distributed;

          let status = 'In Production';
          if (distributed > 0) status = 'Distributed';
          else if (labeled > 0) status = 'Labeled';
          else if (remaining === batch.total_quantity_manufactured) status = 'Not Started';

          if (!acc[status]) {
            acc[status] = { name: status, value: 0 };
          }
          acc[status].value += 1;
          return acc;
        }, {});
        setBatchStatus(Object.values(statusData));
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBatches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Manufactured</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalManufactured.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDistributed.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageUtilization}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Production by Line */}
        <Card>
          <CardHeader>
            <CardTitle>Production by Line</CardTitle>
            <CardDescription>Manufacturing output by production line</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionByLine}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="quantity" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Batch Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Status</CardTitle>
            <CardDescription>Distribution of batch lifecycle stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={batchStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {batchStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

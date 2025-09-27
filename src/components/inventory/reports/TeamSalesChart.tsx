import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/utils/formatters';

interface TeamSalesData {
  team_id: string;
  team_name: string;
  total_revenue: number;
  total_profit: number;
  total_transactions: number;
  profit_margin: number;
}

interface TeamSalesChartProps {
  data: TeamSalesData[];
  chartType?: 'bar' | 'pie';
  isLoading?: boolean;
  showProfit?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const TeamSalesChart: React.FC<TeamSalesChartProps> = ({
  data,
  chartType = 'bar',
  isLoading = false,
  showProfit = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Sales Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Sales Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No sales data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(team => ({
    name: team.team_name.length > 12 ? `${team.team_name.substring(0, 12)}...` : team.team_name,
    fullName: team.team_name,
    revenue: team.total_revenue,
    profit: team.total_profit,
    transactions: team.total_transactions,
    margin: team.profit_margin,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">
            Revenue: <span className="font-medium text-green-600">{formatCurrency(data.revenue)}</span>
          </p>
          {showProfit && (
            <p className="text-sm text-muted-foreground">
              Profit: <span className="font-medium text-blue-600">{formatCurrency(data.profit)}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Transactions: <span className="font-medium">{data.transactions}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Margin: <span className="font-medium">{data.margin.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartType === 'pie') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Sales Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => {
                    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
                    const percent = totalRevenue > 0 ? ((value / totalRevenue) * 100) : 0;
                    return `${name} ${percent.toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Sales Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                fill="#0088FE" 
                name="Revenue"
                radius={[4, 4, 0, 0]}
              />
              {showProfit && (
                <Bar 
                  dataKey="profit" 
                  fill="#00C49F" 
                  name="Profit"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
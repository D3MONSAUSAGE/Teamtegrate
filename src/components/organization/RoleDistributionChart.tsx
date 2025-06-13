
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';

const COLORS = {
  superadmin: '#ef4444',
  admin: '#f97316', 
  manager: '#3b82f6',
  user: '#10b981'
};

const RoleDistributionChart: React.FC = () => {
  const { stats, isLoading } = useOrganizationStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: 'Super Admin', value: stats.superadmins, color: COLORS.superadmin },
    { name: 'Admin', value: stats.admins, color: COLORS.admin },
    { name: 'Manager', value: stats.managers, color: COLORS.manager },
    { name: 'User', value: stats.users, color: COLORS.user }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} user{data.value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleDistributionChart;

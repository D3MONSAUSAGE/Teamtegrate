import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  FileText,
  Calendar
} from 'lucide-react';
import { useRequestAnalytics } from '@/hooks/requests/useRequestAnalytics';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const RequestAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState(30);
  const { metrics, loading, error } = useRequestAnalytics(timeRange);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    className?: string;
  }> = ({ title, value, icon, trend, className = '' }) => (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">+{trend}%</span>
            </div>
          )}
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Request Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Insights and performance metrics for your request system
          </p>
        </div>
        <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests}
          icon={<FileText className="w-5 h-5" />}
        />
        <MetricCard
          title="Pending Review"
          value={metrics.pendingRequests}
          icon={<Clock className="w-5 h-5" />}
          className="border-yellow-200"
        />
        <MetricCard
          title="Completion Rate"
          value={`${metrics.completionRate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          className="border-green-200"
        />
        <MetricCard
          title="Avg. Processing Time"
          value={`${Math.round(metrics.averageProcessingTime / 60)}h`}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* SLA Breaches Alert */}
      {metrics.slaBreaches > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-800">SLA Breaches Detected</p>
              <p className="text-sm text-red-600">
                {metrics.slaBreaches} request(s) have exceeded their SLA deadline
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume Trend */}
        <Card className="p-4">
          <h3 className="font-medium mb-4">Request Volume Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics.requestVolumeTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Request Types */}
        <Card className="p-4">
          <h3 className="font-medium mb-4">Top Request Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.topRequestTypes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Request Status Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Approved', value: metrics.approvedRequests, color: COLORS[0] },
                  { name: 'Pending', value: metrics.pendingRequests, color: COLORS[1] },
                  { name: 'Rejected', value: metrics.rejectedRequests, color: COLORS[2] },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {[
                  { name: 'Approved', value: metrics.approvedRequests },
                  { name: 'Pending', value: metrics.pendingRequests },
                  { name: 'Rejected', value: metrics.rejectedRequests },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                <span className="text-sm">Approved</span>
              </div>
              <Badge variant="outline">{metrics.approvedRequests}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></div>
                <span className="text-sm">Pending</span>
              </div>
              <Badge variant="outline">{metrics.pendingRequests}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[2] }}></div>
                <span className="text-sm">Rejected</span>
              </div>
              <Badge variant="outline">{metrics.rejectedRequests}</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
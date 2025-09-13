import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface TrendData {
  period: string;
  completionRate: number;
  totalTasks: number;
  efficiency: number;
  qualityScore: number;
}

interface TrendAnalysisProps {
  data: TrendData[];
  timeframe: 'week' | 'month' | 'quarter';
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ data, timeframe }) => {
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'week': return 'Weekly Trends';
      case 'month': return 'Monthly Trends';
      case 'quarter': return 'Quarterly Trends';
    }
  };

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previous = values.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(values.length - 3, 1);
    return ((recent - previous) / previous) * 100;
  };

  const completionTrend = calculateTrend(data.map(d => d.completionRate));
  const efficiencyTrend = calculateTrend(data.map(d => d.efficiency));
  const qualityTrend = calculateTrend(data.map(d => d.qualityScore));

  const TrendIndicator = ({ value, label }: { value: number; label: string }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        {value > 0 ? (
          <TrendingUp className="h-4 w-4 text-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-destructive" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${value > 0 ? 'text-success' : 'text-destructive'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {getTimeframeLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <TrendIndicator value={completionTrend} label="Completion Rate" />
            <TrendIndicator value={efficiencyTrend} label="Efficiency" />
            <TrendIndicator value={qualityTrend} label="Quality Score" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completionRate"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#completionGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Performance Metrics Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  name="Completion Rate"
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                  name="Efficiency"
                />
                <Line
                  type="monotone"
                  dataKey="qualityScore"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                  name="Quality Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendAnalysis;
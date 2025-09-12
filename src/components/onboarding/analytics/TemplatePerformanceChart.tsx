import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, Users, Clock, TrendingUp } from 'lucide-react';

interface TemplatePerformanceChartProps {
  data: Array<{
    templateId: string;
    templateName: string;
    totalInstances: number;
    completedInstances: number;
    averageCompletionDays: number;
    completionRate: number;
    averageRating: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const TemplatePerformanceChart: React.FC<TemplatePerformanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <BarChart className="h-12 w-12 mx-auto mb-4" />
            <p>No template performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Template Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Template Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((template, index) => (
              <div key={template.templateId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold">{template.templateName}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {template.totalInstances} total
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {template.averageCompletionDays}d avg
                    </div>
                    {template.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {template.averageRating}/5
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{template.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">completion rate</p>
                  </div>
                  <Badge 
                    variant={template.completionRate >= 80 ? "default" : template.completionRate >= 60 ? "secondary" : "destructive"}
                  >
                    {template.completionRate >= 80 ? 'Excellent' : template.completionRate >= 60 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Template Completion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="templateName" type="category" width={150} />
              <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
              <Bar dataKey="completionRate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Template Usage Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Template Usage Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ templateName, totalInstances }: any) => `${templateName}: ${totalInstances}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalInstances"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Target, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import TrendAnalysis from './TrendAnalysis';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AnalyticsData {
  overview: {
    totalExecutions: number;
    averageScore: number;
    onTimeCompletion: number;
    criticalIssues: number;
  };
  departmentBreakdown: Array<{
    department: string;
    completionRate: number;
    averageScore: number;
    totalTasks: number;
  }>;
  timeDistribution: Array<{
    timeSlot: string;
    executions: number;
    efficiency: number;
  }>;
  riskAssessment: Array<{
    category: string;
    riskLevel: 'low' | 'medium' | 'high';
    count: number;
    trend: number;
  }>;
}

const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalExecutions: 1247,
    averageScore: 87.3,
    onTimeCompletion: 92.1,
    criticalIssues: 3
  },
  departmentBreakdown: [
    { department: 'Sales', completionRate: 94.2, averageScore: 89.1, totalTasks: 342 },
    { department: 'Marketing', completionRate: 88.7, averageScore: 85.6, totalTasks: 298 },
    { department: 'Operations', completionRate: 91.3, averageScore: 88.9, totalTasks: 387 },
    { department: 'Customer Support', completionRate: 96.1, averageScore: 92.3, totalTasks: 220 }
  ],
  timeDistribution: [
    { timeSlot: '06:00', executions: 45, efficiency: 78 },
    { timeSlot: '09:00', executions: 89, efficiency: 85 },
    { timeSlot: '12:00', executions: 156, efficiency: 91 },
    { timeSlot: '15:00', executions: 134, efficiency: 89 },
    { timeSlot: '18:00', executions: 67, efficiency: 82 }
  ],
  riskAssessment: [
    { category: 'Compliance', riskLevel: 'low', count: 12, trend: -8.3 },
    { category: 'Safety', riskLevel: 'medium', count: 5, trend: 2.1 },
    { category: 'Quality', riskLevel: 'low', count: 8, trend: -12.5 },
    { category: 'Operational', riskLevel: 'high', count: 2, trend: 15.7 }
  ]
};

const mockTrendData = [
  { period: 'Week 1', completionRate: 85.2, totalTasks: 150, efficiency: 78.5, qualityScore: 84.1 },
  { period: 'Week 2', completionRate: 88.7, totalTasks: 165, efficiency: 81.2, qualityScore: 86.3 },
  { period: 'Week 3', completionRate: 91.3, totalTasks: 172, efficiency: 84.8, qualityScore: 88.7 },
  { period: 'Week 4', completionRate: 89.1, totalTasks: 168, efficiency: 83.2, qualityScore: 87.2 }
];

const AdvancedAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const data = mockAnalyticsData;

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
    }
  };

  const getRiskBadgeVariant = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'secondary';
      case 'medium': return 'outline';
      case 'high': return 'destructive';
    }
  };

  const pieColors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--muted))'
  ];

  const exportReport = () => {
    // Mock export functionality
    console.log('Exporting report...');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive performance insights and predictions</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="support">Customer Support</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{data.overview.totalExecutions.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{data.overview.averageScore}%</p>
              </div>
              <Target className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On-Time Rate</p>
                <p className="text-2xl font-bold">{data.overview.onTimeCompletion}%</p>
              </div>
              <Clock className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold">{data.overview.criticalIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="departments">Department Breakdown</TabsTrigger>
          <TabsTrigger value="timing">Time Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <TrendAnalysis data={mockTrendData} timeframe="week" />
        </TabsContent>

        <TabsContent value="departments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.departmentBreakdown.map((dept, index) => (
                    <div key={dept.department} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{dept.department}</span>
                        <span className="text-sm text-muted-foreground">
                          {dept.completionRate}% completion
                        </span>
                      </div>
                      <Progress value={dept.completionRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Score: {dept.averageScore}%</span>
                        <span>Tasks: {dept.totalTasks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.departmentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="completionRate"
                        nameKey="department"
                      >
                        {data.departmentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing">
          <Card>
            <CardHeader>
              <CardTitle>Execution Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="timeSlot" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="executions" fill="hsl(var(--primary))" name="Executions" />
                    <Bar dataKey="efficiency" fill="hsl(var(--secondary))" name="Efficiency %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.riskAssessment.map((risk) => (
                  <div key={risk.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{risk.category}</span>
                      <Badge variant={getRiskBadgeVariant(risk.riskLevel)}>
                        {risk.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Issues: {risk.count}</span>
                      <span className={risk.trend > 0 ? 'text-destructive' : 'text-success'}>
                        {risk.trend > 0 ? '+' : ''}{risk.trend}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;
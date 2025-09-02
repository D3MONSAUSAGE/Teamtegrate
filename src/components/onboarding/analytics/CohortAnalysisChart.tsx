import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, TrendingUp, Clock, Target } from 'lucide-react';

interface CohortAnalysisChartProps {
  data: Array<{
    cohort: string;
    totalEmployees: number;
    completedCount: number;
    averageDaysToComplete: number;
    retentionRate: number;
  }>;
}

export const CohortAnalysisChart: React.FC<CohortAnalysisChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <p>No cohort data available</p>
            <p className="text-sm mt-2">Cohort analysis will appear once you have multiple onboarding periods.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEmployeesAllCohorts = data.reduce((sum, cohort) => sum + cohort.totalEmployees, 0);
  const totalCompletedAllCohorts = data.reduce((sum, cohort) => sum + cohort.completedCount, 0);
  const overallRetentionRate = totalEmployeesAllCohorts > 0 
    ? Math.round((totalCompletedAllCohorts / totalEmployeesAllCohorts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Cohort Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cohorts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">Onboarding periods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalEmployeesAllCohorts}</div>
            <p className="text-xs text-muted-foreground">Across all cohorts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Retention</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallRetentionRate}%</div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.reduce((sum, cohort) => sum + cohort.averageDaysToComplete, 0) / data.length)}d
            </div>
            <p className="text-xs text-muted-foreground">To complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-4 p-3 bg-muted rounded-lg text-sm font-medium">
              <div>Cohort</div>
              <div>Started</div>
              <div>Completed</div>
              <div>Retention Rate</div>
              <div>Avg. Days</div>
            </div>
            {data.map((cohort, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 p-3 border rounded-lg text-sm">
                <div className="font-medium">{cohort.cohort}</div>
                <div>{cohort.totalEmployees}</div>
                <div className="text-green-600">{cohort.completedCount}</div>
                <div className={`font-medium ${
                  cohort.retentionRate >= 80 ? 'text-green-600' : 
                  cohort.retentionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(cohort.retentionRate)}%
                </div>
                <div>{cohort.averageDaysToComplete}d</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Retention Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Rate Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${Math.round(Number(value))}%`, 'Retention Rate']} />
              <Line 
                type="monotone" 
                dataKey="retentionRate" 
                stroke="#8884d8" 
                strokeWidth={3}
                name="Retention Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cohort Size vs Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Size vs Completion Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="totalEmployees" fill="#0088FE" name="Total Employees" />
              <Line yAxisId="right" dataKey="averageDaysToComplete" stroke="#00C49F" name="Avg Days" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.length >= 3 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Trend Analysis:</strong> {
                    data[data.length - 1].retentionRate > data[0].retentionRate
                      ? "Your onboarding program is improving over time! Recent cohorts show better retention rates."
                      : "Consider reviewing recent changes - earlier cohorts had better retention rates."
                  }
                </p>
              </div>
            )}

            {overallRetentionRate >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Excellent Performance:</strong> Your overall retention rate of {overallRetentionRate}% indicates a highly effective onboarding program.
                </p>
              </div>
            )}

            {overallRetentionRate < 60 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Action Required:</strong> Low retention rates suggest significant improvements needed in the onboarding process.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
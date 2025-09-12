import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';

interface AssignmentMetrics {
  total_assignments: number;
  avg_response_time_hours: number;
  job_role_breakdown: Array<{
    job_role_name: string;
    assignment_count: number;
    avg_score: number;
  }>;
  approval_trend: Array<{
    date: string;
    assignments: number;
    avg_response_time: number;
  }>;
}

const AssignmentAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['assignment-analytics', user?.organizationId],
    queryFn: async (): Promise<AssignmentMetrics> => {
      if (!user?.organizationId) throw new Error('No organization');

      // Fetch assignment analytics  
      const { data: analytics, error } = await supabase
        .from('request_assignment_analytics')
        .select('*')
        .eq('organization_id', user.organizationId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Get job role names separately for analytics that have job_role_id
      const jobRoleIds = [...new Set(analytics?.filter(a => a.job_role_id).map(a => a.job_role_id))] as string[];
      let jobRolesData: any[] = [];
      
      if (jobRoleIds.length > 0) {
        const { data: roles } = await supabase
          .from('job_roles')
          .select('id, name')
          .in('id', jobRoleIds);
        jobRolesData = roles || [];
      }

      const totalAssignments = analytics?.length || 0;
      const avgResponseTime = analytics?.reduce((sum, a) => sum + (a.response_time_hours || 0), 0) / totalAssignments || 0;

      // Job role breakdown
      const jobRoleMap = new Map();
      analytics?.forEach(a => {
        const roleData = jobRolesData.find(r => r.id === a.job_role_id);
        const roleName = roleData?.name || 'Unspecified';
        if (!jobRoleMap.has(roleName)) {
          jobRoleMap.set(roleName, { count: 0, totalScore: 0, scoreCount: 0 });
        }
        const role = jobRoleMap.get(roleName);
        role.count++;
        if (a.assignment_score) {
          role.totalScore += a.assignment_score;
          role.scoreCount++;
        }
      });

      const jobRoleBreakdown = Array.from(jobRoleMap.entries()).map(([name, data]) => ({
        job_role_name: name,
        assignment_count: data.count,
        avg_score: data.scoreCount > 0 ? Math.round(data.totalScore / data.scoreCount) : 0
      }));

      // Approval trend (last 7 days)
      const approvalTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayAnalytics = analytics?.filter(a => 
          a.created_at.startsWith(dateStr)
        ) || [];
        
        approvalTrend.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          assignments: dayAnalytics.length,
          avg_response_time: dayAnalytics.reduce((sum, a) => sum + (a.response_time_hours || 0), 0) / dayAnalytics.length || 0
        });
      }

      return {
        total_assignments: totalAssignments,
        avg_response_time_hours: avgResponseTime,
        job_role_breakdown: jobRoleBreakdown,
        approval_trend: approvalTrend
      };
    },
    enabled: !!user?.organizationId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No assignment analytics data available yet.</p>
          <p className="text-sm">Data will appear as requests are processed.</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_assignments}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avg_response_time_hours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">Average processing time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Job Roles</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.job_role_breakdown.length}</div>
            <p className="text-xs text-muted-foreground">Handling requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.job_role_breakdown.reduce((sum, r) => sum + r.avg_score, 0) / metrics.job_role_breakdown.length) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Average effectiveness</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.approval_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assignments" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.job_role_breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ job_role_name, assignment_count }: any) => `${job_role_name}: ${assignment_count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="assignment_count"
                >
                  {metrics.job_role_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Role Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.job_role_breakdown.map((role, index) => (
              <div key={role.job_role_name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <h4 className="font-medium">{role.job_role_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {role.assignment_count} assignments
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={role.avg_score >= 80 ? "default" : role.avg_score >= 60 ? "secondary" : "destructive"}>
                    {role.avg_score > 0 ? `${role.avg_score}/100` : 'No rating'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentAnalyticsDashboard;
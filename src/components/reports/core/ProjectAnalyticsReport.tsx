import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FolderOpen, CheckCircle, AlertTriangle, Users } from 'lucide-react';

interface ProjectAnalyticsData {
  project_id: string;
  project_title: string;
  total_tasks: number;
  completed_tasks: number;
  team_members: number;
  completion_rate: number;
  overdue_count: number;
}

interface ProjectAnalyticsReportProps {
  data: ProjectAnalyticsData[];
  isLoading: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const ProjectAnalyticsReport: React.FC<ProjectAnalyticsReportProps> = ({
  data,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Project Data Available</h3>
          <p className="text-muted-foreground">No projects have tasks in the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall metrics
  const totalProjects = data.length;
  const totalTasks = data.reduce((sum, project) => sum + project.total_tasks, 0);
  const totalCompleted = data.reduce((sum, project) => sum + project.completed_tasks, 0);
  const totalOverdue = data.reduce((sum, project) => sum + project.overdue_count, 0);
  const avgCompletionRate = data.length > 0 
    ? Math.round(data.reduce((sum, project) => sum + project.completion_rate, 0) / data.length)
    : 0;

  // Find top performing project
  const topProject = data.reduce((best, project) => 
    project.completion_rate > best.completion_rate ? project : best,
    { completion_rate: 0, project_title: 'N/A' }
  );

  // Prepare chart data
  const chartData = data
    .sort((a, b) => b.completion_rate - a.completion_rate)
    .slice(0, 8) // Top 8 projects
    .map(project => ({
      ...project,
      pending_tasks: project.total_tasks - project.completed_tasks
    }));

  // Pie chart data for project status distribution
  const statusData = [
    { name: 'Completed', value: totalCompleted, color: COLORS[0] },
    { name: 'Pending', value: totalTasks - totalCompleted - totalOverdue, color: COLORS[1] },
    { name: 'Overdue', value: totalOverdue, color: COLORS[3] }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-foreground">{totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {totalCompleted} completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Project</p>
                <p className="text-lg font-bold text-foreground truncate">{topProject.project_title}</p>
                <Badge variant="default" className="text-xs mt-1">
                  {topProject.completion_rate}% complete
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                <p className="text-2xl font-bold text-foreground">{avgCompletionRate}%</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {totalOverdue} overdue
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="project_title" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value,
                    name === 'completed_tasks' ? 'Completed' : 'Pending'
                  ]}
                />
                <Bar dataKey="completed_tasks" fill="hsl(var(--primary))" name="completed_tasks" />
                <Bar dataKey="pending_tasks" fill="hsl(var(--muted))" name="pending_tasks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }: any) => 
                    `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Project Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Team Size</TableHead>
                <TableHead>Total Tasks</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                .sort((a, b) => b.completion_rate - a.completion_rate)
                .map((project) => (
                  <TableRow key={project.project_id}>
                    <TableCell className="font-medium max-w-48 truncate">
                      {project.project_title}
                    </TableCell>
                    <TableCell>{project.team_members || '0'}</TableCell>
                    <TableCell>{project.total_tasks}</TableCell>
                    <TableCell>{project.completed_tasks}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={project.completion_rate} className="w-20 h-2" />
                        <span className="text-sm">{project.completion_rate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.overdue_count > 0 ? (
                        <Badge variant="destructive">{project.overdue_count}</Badge>
                      ) : (
                        <Badge variant="outline">0</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          project.completion_rate >= 90 ? "default" :
                          project.completion_rate >= 70 ? "secondary" :
                          project.overdue_count > 0 ? "destructive" : "outline"
                        }
                      >
                        {project.completion_rate >= 90 ? 'Excellent' :
                         project.completion_rate >= 70 ? 'On Track' :
                         project.overdue_count > 0 ? 'At Risk' : 'Starting'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
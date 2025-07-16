
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Shield, 
  User, 
  FileText, 
  Clock, 
  TrendingUp,
  Activity,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeOverview } from '@/hooks/admin/useEmployeeOverview';
import { format } from 'date-fns';

const EmployeeDashboard: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const {
    employee,
    tasks,
    projects,
    journalEntries,
    timeEntries,
    performanceMetrics,
    isLoading,
    error
  } = useEmployeeOverview(userId || null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access employee dashboards.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Loading Employee Dashboard</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Employee not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard/organization')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={employee.avatar_url} />
                <AvatarFallback>
                  {employee.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{employee.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{employee.email}</span>
                  <Badge variant={employee.role === 'admin' ? 'destructive' : 'outline'}>
                    {employee.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              <Shield className="h-4 w-4" />
              Admin Access
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Task Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics?.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {performanceMetrics?.completedTasks || 0} of {(performanceMetrics?.completedTasks || 0) + (performanceMetrics?.activeTasks || 0)} tasks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics?.weeklyHours || 0}h</div>
              <p className="text-xs text-muted-foreground">
                Avg {performanceMetrics?.avgDailyHours || 0}h per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Projects involved in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                Journal Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{journalEntries?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total entries created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks?.length || 0})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects?.length || 0})</TabsTrigger>
            <TabsTrigger value="journal">Journal ({journalEntries?.length || 0})</TabsTrigger>
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks?.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.status}</p>
                      </div>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Time Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Time Tracking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>This Week</span>
                    <span className="font-semibold">{performanceMetrics?.weeklyHours || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <span className="font-semibold">{performanceMetrics?.monthlyHours || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Average</span>
                    <span className="font-semibold">{performanceMetrics?.avgDailyHours || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Activity</span>
                    <span className="text-sm text-muted-foreground">
                      {performanceMetrics?.lastActivity 
                        ? format(new Date(performanceMetrics.lastActivity), 'MMM d, HH:mm')
                        : 'N/A'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid gap-4">
              {tasks?.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={task.status === 'Completed' ? 'default' : 'outline'}>
                            {task.status}
                          </Badge>
                          <Badge variant="secondary">{task.priority}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {task.deadline && (
                          <p>Due: {format(new Date(task.deadline), 'MMM d, yyyy')}</p>
                        )}
                        <p>Created: {format(new Date(task.created_at), 'MMM d')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="grid gap-4">
              {projects?.map((project) => (
                <Card key={project.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{project.title}</h4>
                        <Badge variant={project.status === 'Completed' ? 'default' : 'outline'}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tasks: {project.tasks_count || 0}</span>
                        <span>{project.manager_id === employee.id ? 'Manager' : 'Team Member'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="journal" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You are viewing private journal entries as an administrator. This access is logged for compliance.
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-4">
              {journalEntries?.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{entry.title}</h4>
                        <div className="flex items-center gap-2">
                          {entry.is_public && <Badge variant="outline">Public</Badge>}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {entry.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <div className="grid gap-4">
              {timeEntries?.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {format(new Date(entry.clock_in), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground">{entry.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {entry.duration_minutes ? `${Math.round(entry.duration_minutes / 60 * 10) / 10}h` : 'Active'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.clock_out ? 
                            `Ended ${format(new Date(entry.clock_out), 'HH:mm')}` : 
                            'In Progress'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDashboard;


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  TrendingUp, 
  Activity,
  Shield,
  Eye,
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import { useEmployeeOverview } from '@/hooks/admin/useEmployeeOverview';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { UserJobRoleManager } from '@/components/organization/UserJobRoleManager';

interface EnhancedEmployeeProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnhancedEmployeeProfileDialog: React.FC<EnhancedEmployeeProfileDialogProps> = ({
  userId,
  open,
  onOpenChange
}) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    employee,
    tasks,
    projects,
    journalEntries,
    timeEntries,
    activityTimeline,
    performanceMetrics,
    isLoading,
    error,
    logAdminAccess
  } = useEmployeeOverview(userId);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (userId && tab !== 'overview') {
      logAdminAccess(tab);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee?.avatar_url} />
              <AvatarFallback>
                {employee?.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span>{employee?.name}</span>
                <Badge variant={employee?.role === 'admin' ? 'destructive' : 'outline'}>
                  {employee?.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{employee?.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-600">Admin Access</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobroles">Job Roles</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
              <TabsTrigger value="time">Time Tracking</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)] mt-4">
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Task Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Completion Rate</span>
                          <span className="font-semibold">{performanceMetrics?.completionRate || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Active Tasks</span>
                          <span className="font-semibold">{performanceMetrics?.activeTasks || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Completed</span>
                          <span className="font-semibold">{performanceMetrics?.completedTasks || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">This Week</span>
                          <span className="font-semibold">{performanceMetrics?.weeklyHours || 0}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">This Month</span>
                          <span className="font-semibold">{performanceMetrics?.monthlyHours || 0}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg/Day</span>
                          <span className="font-semibold">{performanceMetrics?.avgDailyHours || 0}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Activity Level
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Projects</span>
                          <span className="font-semibold">{projects?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Journal Entries</span>
                          <span className="font-semibold">{journalEntries?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Last Active</span>
                          <span className="font-semibold text-xs">
                            {performanceMetrics?.lastActivity 
                              ? format(new Date(performanceMetrics.lastActivity), 'MMM d')
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    You are viewing employee data as an administrator. This access is logged for compliance purposes.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="jobroles" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Job Role Management
                  </h3>
                </div>
                
                <Card>
                  <CardContent className="pt-6">
                    <UserJobRoleManager userId={userId || ''} userName={employee?.name || ''} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Employee Tasks</h3>
                  <Badge>{tasks?.length || 0} Total</Badge>
                </div>
                
                <div className="grid gap-4">
                  {tasks?.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
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
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Employee Projects</h3>
                  <Badge>{projects?.length || 0} Total</Badge>
                </div>
                
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
                            <span>{project.manager_id === employee?.id ? 'Manager' : 'Team Member'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="journal" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Journal Entries</h3>
                  <div className="flex items-center gap-2">
                    <Badge>{journalEntries?.length || 0} Total</Badge>
                    <Alert className="inline-flex items-center gap-2 p-2">
                      <Shield className="h-3 w-3" />
                      <span className="text-xs">Sensitive Data</span>
                    </Alert>
                  </div>
                </div>
                
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
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Time Tracking</h3>
                  <Badge>{timeEntries?.length || 0} Sessions</Badge>
                </div>
                
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

              <TabsContent value="activity" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Activity Timeline</h3>
                  <Badge>{activityTimeline?.length || 0} Events</Badge>
                </div>
                
                <div className="space-y-4">
                  {activityTimeline?.map((activity, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{activity.description}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                          {activity.details && (
                            <span className="text-xs text-muted-foreground">
                              {activity.details}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedEmployeeProfileDialog;

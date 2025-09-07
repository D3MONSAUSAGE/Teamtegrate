import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Trophy, 
  AlertTriangle,
  Database,
  Settings,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProgress } from '@/hooks/useTrainingData';
import OrphanedQuizCleanupTool from './OrphanedQuizCleanupTool';

const TrainingDashboard: React.FC = () => {
  const [showCleanupTool, setShowCleanupTool] = useState(false);
  const { user } = useAuth();
  const { data: employeeProgress = [], isLoading } = useEmployeeProgress();
  
  const isAdmin = user && ['admin', 'superadmin', 'manager'].includes(user.role);

  // Calculate overall stats
  const totalEmployees = employeeProgress.length;
  const totalAssignments = employeeProgress.reduce((sum, emp) => sum + emp.totalAssignments, 0);
  const completedAssignments = employeeProgress.reduce((sum, emp) => sum + emp.completedAssignments, 0);
  const overallCompletionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Performance metrics
  const topPerformers = employeeProgress
    .filter(emp => emp.completionRate > 80)
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5);

  const needsAttention = employeeProgress
    .filter(emp => emp.completionRate < 50 || emp.pendingAssignments > 5)
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor training progress and manage learning initiatives
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCleanupTool(true)}
              variant="outline"
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Data Cleanup
            </Button>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-sm text-muted-foreground">
              Active learners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-600" />
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-sm text-muted-foreground">
              Training modules assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCompletionRate}%</div>
            <p className="text-sm text-muted-foreground">
              Overall progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needsAttention.length}</div>
            <p className="text-sm text-muted-foreground">
              Employees behind
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Employee Progress</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          {isAdmin && <TabsTrigger value="management">Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Training Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeProgress.slice(0, 5).map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.department}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={employee.completionRate > 80 ? 'default' : employee.completionRate > 50 ? 'secondary' : 'destructive'}>
                          {employee.completionRate}%
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {employee.completedAssignments}/{employee.totalAssignments} completed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Training Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Training Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Courses Completed</span>
                    <span className="font-medium">
                      {employeeProgress.reduce((sum, emp) => sum + emp.coursesCompleted, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quizzes Completed</span>
                    <span className="font-medium">
                      {employeeProgress.reduce((sum, emp) => sum + emp.quizzesCompleted, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Certificates Uploaded</span>
                    <span className="font-medium">
                      {employeeProgress.reduce((sum, emp) => sum + emp.certificatesUploaded, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Certificates Verified</span>
                    <span className="font-medium">
                      {employeeProgress.reduce((sum, emp) => sum + emp.certificatesVerified, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Employee Training Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">Loading employee progress...</div>
                ) : employeeProgress.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No training progress data available</p>
                  </div>
                ) : (
                  employeeProgress.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {employee.email} • {employee.department}
                          </p>
                        </div>
                        <Badge variant={employee.completionRate > 80 ? 'default' : employee.completionRate > 50 ? 'secondary' : 'destructive'}>
                          {employee.completionRate}% Complete
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <p className="font-medium">{employee.totalAssignments}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Completed:</span>
                          <p className="font-medium text-green-600">{employee.completedAssignments}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">In Progress:</span>
                          <p className="font-medium text-blue-600">{employee.inProgressAssignments}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pending:</span>
                          <p className="font-medium text-orange-600">{employee.pendingAssignments}</p>
                        </div>
                      </div>
                      
                      {employee.averageQuizScore && (
                        <div className="mt-2">
                          <span className="text-sm text-muted-foreground">Average Quiz Score: </span>
                          <span className="font-medium">{employee.averageQuizScore}%</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No top performers yet</p>
                  ) : (
                    topPerformers.map((employee, index) => (
                      <div key={employee.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{employee.department}</p>
                          </div>
                        </div>
                        <Badge variant="default">{employee.completionRate}%</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Needs Attention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {needsAttention.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">All employees on track!</p>
                  ) : (
                    needsAttention.map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.pendingAssignments} pending assignments
                          </p>
                        </div>
                        <Badge variant="destructive">{employee.completionRate}%</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="management">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Management Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Management Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setShowCleanupTool(true)}
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Clean Up Orphaned Quiz Data
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Generate Training Reports
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Export Training Data
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Training Settings
                  </Button>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Integrity</span>
                      <Badge variant="default">Good</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quiz Data Quality</span>
                      <Badge variant="default">Clean</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Training Assignments</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Certificate Uploads</span>
                      <Badge variant="secondary">Pending Review</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Cleanup Tool Dialog */}
      {showCleanupTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-7xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Orphaned Quiz Cleanup Tool</h2>
              <Button
                onClick={() => setShowCleanupTool(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <OrphanedQuizCleanupTool
                open={showCleanupTool}
                onOpenChange={setShowCleanupTool}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingDashboard;
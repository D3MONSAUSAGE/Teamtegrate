import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Users, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Download,
  User,
  Calendar,
  BookOpen,
  GraduationCap,
  Filter,
  Eye
} from 'lucide-react';
import { useEmployeeProgress, useTrainingStats } from '@/hooks/useTrainingData';
import { format } from 'date-fns';

interface EmployeeProgressDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmployeeProgressDashboard: React.FC<EmployeeProgressDashboardProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  const { data: employeeData = [], isLoading } = useEmployeeProgress();
  const { data: stats } = useTrainingStats();

  // Filter employees based on search term
  const filteredEmployees = employeeData.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate organization-wide metrics
  const totalEmployees = employeeData.length;
  const employeesWithProgress = employeeData.filter(emp => emp.totalAssignments > 0).length;
  const averageCompletionRate = totalEmployees > 0 
    ? Math.round(employeeData.reduce((sum, emp) => sum + emp.completionRate, 0) / totalEmployees)
    : 0;
  const averageQuizScore = employeeData.filter(emp => emp.averageQuizScore > 0).length > 0
    ? Math.round(employeeData.reduce((sum, emp) => sum + (emp.averageQuizScore || 0), 0) / 
        employeeData.filter(emp => emp.averageQuizScore > 0).length)
    : 0;

  const exportEmployeeData = () => {
    const csvData = filteredEmployees.map(employee => ({
      'Name': employee.name,
      'Email': employee.email,
      'Role': employee.role,
      'Total Assignments': employee.totalAssignments,
      'Completed Assignments': employee.completedAssignments,
      'Completion Rate': `${employee.completionRate}%`,
      'Average Quiz Score': employee.averageQuizScore ? `${employee.averageQuizScore}%` : 'N/A',
      'Courses Completed': employee.coursesCompleted,
      'Quizzes Completed': employee.quizzesCompleted,
      'Last Activity': employee.lastActivity ? format(new Date(employee.lastActivity), 'yyyy-MM-dd') : 'Never'
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-training-progress-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              Employee Training Progress
            </DialogTitle>
            <Button onClick={exportEmployeeData} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Organization Overview</TabsTrigger>
            <TabsTrigger value="employees">Employee Progress</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Organization Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalEmployees}</p>
                      <p className="text-sm text-muted-foreground">Total Employees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{employeesWithProgress}</p>
                      <p className="text-sm text-muted-foreground">Active Learners</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{averageCompletionRate}%</p>
                      <p className="text-sm text-muted-foreground">Avg Completion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{averageQuizScore}%</p>
                      <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Training Content Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Training Content Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <GraduationCap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{stats?.total_courses || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Courses</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats?.total_quizzes || 0}</p>
                  <p className="text-sm text-muted-foreground">Available Quizzes</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{stats?.completion_rate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Overall Success Rate</p>
                </div>
              </CardContent>
            </Card>

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
                  {employeeData
                    .filter(emp => emp.totalAssignments > 0)
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .slice(0, 5)
                    .map((employee, index) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            index === 0 ? 'bg-yellow-100' :
                            index === 1 ? 'bg-gray-100' :
                            index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                          }`}>
                            <User className={`h-4 w-4 ${
                              index === 0 ? 'text-yellow-600' :
                              index === 1 ? 'text-gray-600' :
                              index === 2 ? 'text-orange-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {employee.completionRate}% Complete
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Employee Progress Table */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Training Progress ({filteredEmployees.length} employees)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredEmployees.map((employee) => (
                      <div key={employee.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                              <Badge variant="outline" className="mt-1">
                                {employee.role}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEmployee(employee)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-muted-foreground">Assignments:</span>
                            <span className="ml-2 font-semibold">
                              {employee.completedAssignments}/{employee.totalAssignments}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Completion:</span>
                            <span className="ml-2 font-semibold">{employee.completionRate}%</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Quiz Avg:</span>
                            <span className="ml-2 font-semibold">
                              {employee.averageQuizScore ? `${employee.averageQuizScore}%` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Last Active:</span>
                            <span className="ml-2 font-semibold">
                              {employee.lastActivity ? format(new Date(employee.lastActivity), 'MMM d') : 'Never'}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Training Progress</span>
                            <span>{employee.completionRate}%</span>
                          </div>
                          <Progress value={employee.completionRate} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Performance Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { range: '90-100%', count: employeeData.filter(e => e.completionRate >= 90).length, color: 'bg-green-500' },
                      { range: '75-89%', count: employeeData.filter(e => e.completionRate >= 75 && e.completionRate < 90).length, color: 'bg-blue-500' },
                      { range: '50-74%', count: employeeData.filter(e => e.completionRate >= 50 && e.completionRate < 75).length, color: 'bg-yellow-500' },
                      { range: '25-49%', count: employeeData.filter(e => e.completionRate >= 25 && e.completionRate < 50).length, color: 'bg-orange-500' },
                      { range: '0-24%', count: employeeData.filter(e => e.completionRate < 25).length, color: 'bg-red-500' }
                    ].map((item) => (
                      <div key={item.range} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${item.color}`} />
                        <span className="text-sm flex-1">{item.range}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Role Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      employeeData.reduce((acc, emp) => {
                        if (!acc[emp.role]) {
                          acc[emp.role] = { count: 0, avgCompletion: 0 };
                        }
                        acc[emp.role].count += 1;
                        acc[emp.role].avgCompletion += emp.completionRate;
                        return acc;
                      }, {} as Record<string, { count: number; avgCompletion: number }>)
                    ).map(([role, data]) => (
                      <div key={role} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium capitalize">{role}</p>
                          <p className="text-sm text-muted-foreground">{data.count} employees</p>
                        </div>
                        <Badge variant="outline">
                          {Math.round(data.avgCompletion / data.count)}% avg
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedEmployee.name} - Training Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant="outline">{selectedEmployee.role}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">{selectedEmployee.completionRate}%</p>
                    <Progress value={selectedEmployee.completionRate} className="mt-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Quiz Score</p>
                    <p className="text-2xl font-bold">
                      {selectedEmployee.averageQuizScore ? `${selectedEmployee.averageQuizScore}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assignments</p>
                    <p className="text-xl font-bold">{selectedEmployee.totalAssignments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold text-green-600">{selectedEmployee.completedAssignments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-orange-600">
                      {selectedEmployee.totalAssignments - selectedEmployee.completedAssignments}
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeProgressDashboard;
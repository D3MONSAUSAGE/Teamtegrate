import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Users, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Download,
  User,
  Eye,
  Filter,
  FileText,
  Calendar,
  BookOpen,
  GraduationCap,
  Award,
  AlertCircle,
  Building2,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { useEmployeeProgress } from '@/hooks/useTrainingData';
import { useUsers } from '@/hooks/useUsers';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmbeddedCertificateReview from './EmbeddedCertificateReview';
import QuizAttemptViewer from './QuizAttemptViewer';
import { useQuizAttempts } from '@/hooks/useTrainingData';

interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  jobTitle: string;
  hireDate?: string;
  teams: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  pendingAssignments: number;
  completionRate: number;
  averageQuizScore?: number;
  coursesCompleted: number;
  quizzesCompleted: number;
  certificatesUploaded: number;
  certificatesVerified: number;
  lastActivity?: Date;
  assignments: any[];
}

const EmbeddedEmployeeRecords: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [employeeDetailsOpen, setEmployeeDetailsOpen] = useState(false);
  
  // Quiz viewing state
  const [selectedQuizAttempt, setSelectedQuizAttempt] = useState<{
    quizId: string;
    assignment: any;
    open: boolean;
  }>({ quizId: '', assignment: null, open: false });
  
  const { data: employeeData = [], isLoading } = useEmployeeProgress();
  const { users } = useUsers();

  // Function to view quiz details
  const viewQuizDetails = (assignment: any) => {
    const quizId = assignment.content_id;
    setSelectedQuizAttempt({
      quizId,
      assignment,
      open: true
    });
  };

  // Get unique teams and departments for filtering
  const teams = useMemo(() => {
    const teamSet = new Set<string>();
    const teamMap = new Map<string, string>();
    employeeData.forEach(emp => {
      emp.teams.forEach(team => {
        teamSet.add(team.id);
        teamMap.set(team.id, team.name);
      });
    });
    return Array.from(teamSet).map(id => ({ id, name: teamMap.get(id) || 'Unknown' }));
  }, [employeeData]);

  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    employeeData.forEach(emp => {
      if (emp.department && emp.department !== 'Unassigned') {
        deptSet.add(emp.department);
      }
    });
    return Array.from(deptSet).sort();
  }, [employeeData]);

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employeeData.filter(employee => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          employee.name.toLowerCase().includes(searchLower) ||
          employee.email.toLowerCase().includes(searchLower) ||
          employee.role.toLowerCase().includes(searchLower) ||
          employee.department.toLowerCase().includes(searchLower) ||
          employee.jobTitle.toLowerCase().includes(searchLower) ||
          employee.teams.some(team => team.name.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Team filter
      if (selectedTeam !== 'all') {
        const inSelectedTeam = employee.teams.some(team => team.id === selectedTeam);
        if (!inSelectedTeam) return false;
      }

      // Department filter
      if (selectedDepartment !== 'all') {
        if (employee.department !== selectedDepartment) return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        switch (selectedStatus) {
          case 'not_started':
            if (employee.totalAssignments === 0 || employee.inProgressAssignments + employee.completedAssignments === 0) return true;
            return false;
          case 'in_progress':
            if (employee.inProgressAssignments > 0) return true;
            return false;
          case 'completed':
            if (employee.completionRate === 100 && employee.totalAssignments > 0) return true;
            return false;
          case 'overdue':
            const hasOverdue = employee.assignments.some(assignment => 
              assignment.due_date && 
              new Date(assignment.due_date) < new Date() && 
              assignment.status !== 'completed'
            );
            if (hasOverdue) return true;
            return false;
        }
      }

      return true;
    });
  }, [employeeData, searchTerm, selectedTeam, selectedDepartment, selectedStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEmployees = filteredEmployees.length;
    const employeesWithAssignments = filteredEmployees.filter(emp => emp.totalAssignments > 0).length;
    const averageCompletion = totalEmployees > 0 
      ? Math.round(filteredEmployees.reduce((sum, emp) => sum + emp.completionRate, 0) / totalEmployees)
      : 0;
    const employeesCompleted = filteredEmployees.filter(emp => emp.completionRate === 100 && emp.totalAssignments > 0).length;
    const employeesInProgress = filteredEmployees.filter(emp => emp.inProgressAssignments > 0).length;
    const totalCertificatesUploaded = filteredEmployees.reduce((sum, emp) => sum + emp.certificatesUploaded, 0);
    const totalCertificatesVerified = filteredEmployees.reduce((sum, emp) => sum + emp.certificatesVerified, 0);

    return {
      totalEmployees,
      employeesWithAssignments,
      averageCompletion,
      employeesCompleted,
      employeesInProgress,
      totalCertificatesUploaded,
      totalCertificatesVerified,
      completionRate: employeesWithAssignments > 0 
        ? Math.round((employeesCompleted / employeesWithAssignments) * 100) 
        : 0
    };
  }, [filteredEmployees]);

  const exportEmployeeData = () => {
    const csvData = filteredEmployees.map(employee => ({
      'Name': employee.name,
      'Email': employee.email,
      'Role': employee.role,
      'Department': employee.department,
      'Job Title': employee.jobTitle,
      'Teams': employee.teams.map(team => team.name).join('; '),
      'Total Assignments': employee.totalAssignments,
      'Completed': employee.completedAssignments,
      'In Progress': employee.inProgressAssignments,
      'Pending': employee.pendingAssignments,
      'Completion Rate': `${employee.completionRate}%`,
      'Average Quiz Score': employee.averageQuizScore ? `${employee.averageQuizScore}%` : 'N/A',
      'Courses Completed': employee.coursesCompleted,
      'Quizzes Completed': employee.quizzesCompleted,
      'Certificates Uploaded': employee.certificatesUploaded,
      'Certificates Verified': employee.certificatesVerified,
      'Last Activity': employee.lastActivity ? format(employee.lastActivity, 'yyyy-MM-dd HH:mm') : 'Never'
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-training-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (employee: EmployeeRecord) => {
    if (employee.totalAssignments === 0) return 'secondary';
    if (employee.completionRate === 100) return 'default';
    if (employee.inProgressAssignments > 0) return 'secondary';
    return 'destructive';
  };

  const getStatusBadgeText = (employee: EmployeeRecord) => {
    if (employee.totalAssignments === 0) return 'No Assignments';
    if (employee.completionRate === 100) return 'Completed';
    if (employee.inProgressAssignments > 0) return 'In Progress';
    return 'Pending';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading employee training records...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold">Employee Training Records</h3>
          </div>
          <Button onClick={exportEmployeeData} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="records">Training Records</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            {/* Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stats.totalEmployees}</p>
                      <p className="text-xs text-muted-foreground">Total Employees</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stats.averageCompletion}%</p>
                      <p className="text-xs text-muted-foreground">Avg Completion</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stats.employeesInProgress}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100">
                      <Award className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stats.totalCertificatesVerified}</p>
                      <p className="text-xs text-muted-foreground">Certificates</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Employee Records */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Records ({filteredEmployees.length} employees)</CardTitle>
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
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{employee.name}</p>
                                <Badge variant={getStatusBadgeVariant(employee)}>
                                  {getStatusBadgeText(employee)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {employee.role}
                                </Badge>
                                {employee.department !== 'Unassigned' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    {employee.department}
                                  </Badge>
                                )}
                                {employee.teams.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    {employee.teams.length} team{employee.teams.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setEmployeeDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Assignments:</span>
                            <div className="font-semibold">
                              {employee.completedAssignments}/{employee.totalAssignments}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Completion:</span>
                            <div className="font-semibold">{employee.completionRate}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quiz Avg:</span>
                            <div className="font-semibold">
                              {employee.averageQuizScore ? `${employee.averageQuizScore}%` : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Courses:</span>
                            <div className="font-semibold">{employee.coursesCompleted}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Certificates:</span>
                            <div className="font-semibold">{employee.certificatesVerified}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Active:</span>
                            <div className="font-semibold">
                              {employee.lastActivity ? format(employee.lastActivity, 'MMM d') : 'Never'}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Training Progress</span>
                            <span>{employee.completionRate}%</span>
                          </div>
                          <Progress value={employee.completionRate} className="h-2" />
                        </div>
                      </div>
                    ))}

                    {filteredEmployees.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No employees match your current filters</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { range: '90-100%', count: filteredEmployees.filter(e => e.completionRate >= 90).length, color: 'bg-green-500' },
                      { range: '75-89%', count: filteredEmployees.filter(e => e.completionRate >= 75 && e.completionRate < 90).length, color: 'bg-blue-500' },
                      { range: '50-74%', count: filteredEmployees.filter(e => e.completionRate >= 50 && e.completionRate < 75).length, color: 'bg-yellow-500' },
                      { range: '25-49%', count: filteredEmployees.filter(e => e.completionRate >= 25 && e.completionRate < 50).length, color: 'bg-orange-500' },
                      { range: '0-24%', count: filteredEmployees.filter(e => e.completionRate < 25).length, color: 'bg-red-500' }
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
                  <CardTitle>Training Status Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-green-50">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{stats.employeesCompleted}</p>
                      <p className="text-sm text-muted-foreground">Completed All Training</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50">
                      <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{stats.employeesInProgress}</p>
                      <p className="text-sm text-muted-foreground">Training In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Status</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="p-4 rounded-lg bg-yellow-50">
                    <FileText className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">{stats.totalCertificatesUploaded}</p>
                    <p className="text-sm text-muted-foreground">Total Uploaded</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50">
                    <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{stats.totalCertificatesVerified}</p>
                    <p className="text-sm text-muted-foreground">Verified</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Certificate Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredEmployees
                      .filter(emp => emp.certificatesUploaded > 0)
                      .slice(0, 5)
                      .map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 rounded border">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <Award className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.certificatesUploaded} uploaded, {employee.certificatesVerified} verified
                              </p>
                            </div>
                          </div>
                          <Badge variant={employee.certificatesVerified > 0 ? "default" : "secondary"}>
                            {employee.certificatesVerified > 0 ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Employee Details Dialog */}
      {selectedEmployee && (
        <Dialog open={employeeDetailsOpen} onOpenChange={setEmployeeDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedEmployee.name} - Training Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Employee Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Employee Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{selectedEmployee.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedEmployee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Job Title</p>
                    <p className="font-medium">{selectedEmployee.jobTitle || 'Not specified'}</p>
                  </div>
                  {selectedEmployee.hireDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Hire Date</p>
                      <p className="font-medium">{format(new Date(selectedEmployee.hireDate), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Teams</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEmployee.teams.length > 0 ? (
                        selectedEmployee.teams.map(team => (
                          <Badge key={team.id} variant="outline" className="text-xs">
                            {team.name} ({team.role})
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No team assignments</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Training Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Training Progress Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg border">
                      <p className="text-2xl font-bold text-blue-600">{selectedEmployee.totalAssignments}</p>
                      <p className="text-sm text-muted-foreground">Total Assignments</p>
                    </div>
                    <div className="text-center p-3 rounded-lg border">
                      <p className="text-2xl font-bold text-green-600">{selectedEmployee.completedAssignments}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-3 rounded-lg border">
                      <p className="text-2xl font-bold text-yellow-600">{selectedEmployee.inProgressAssignments}</p>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                    <div className="text-center p-3 rounded-lg border">
                      <p className="text-2xl font-bold text-red-600">{selectedEmployee.pendingAssignments}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{selectedEmployee.completionRate}%</span>
                    </div>
                    <Progress value={selectedEmployee.completionRate} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Training Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {selectedEmployee.assignments.length > 0 ? (
                        selectedEmployee.assignments.map((assignment) => (
                          <div key={assignment.id} className="p-3 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{assignment.content_title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant={assignment.status === 'completed' ? 'default' : assignment.status === 'in_progress' ? 'secondary' : 'destructive'}>
                                  {assignment.status}
                                </Badge>
                                {assignment.assignment_type === 'quiz' && assignment.status === 'completed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => viewQuizDetails(assignment)}
                                    className="h-7 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Details
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div>Type: {assignment.assignment_type}</div>
                              <div>Priority: {assignment.priority}</div>
                              <div>
                                Assigned: {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}
                              </div>
                              {assignment.due_date && (
                                <div>
                                  Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                                </div>
                              )}
                            </div>
                            {assignment.completion_score && (
                              <div className="mt-2">
                                <div className="flex justify-between text-sm">
                                  <span>Score: {assignment.completion_score}%</span>
                                  {assignment.completed_at && (
                                    <span>Completed: {format(new Date(assignment.completed_at), 'MMM d, yyyy')}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No training assignments found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Employee details have been selected, certificate review is now available in the Certificates tab */}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quiz Attempt Viewer */}
      <QuizAttemptViewer
        open={selectedQuizAttempt.open}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuizAttempt({ quizId: '', assignment: null, open: false });
          }
        }}
        quizData={selectedQuizAttempt.open ? {
          quizId: selectedQuizAttempt.quizId,
          employeeName: selectedEmployee?.name || '',
          assignment: selectedQuizAttempt.assignment
        } : undefined}
      />
    </>
  );
};

export default EmbeddedEmployeeRecords;
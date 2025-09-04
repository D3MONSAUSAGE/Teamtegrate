import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Download,
  Trash2,
  RotateCcw,
  Eye,
  UserX,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import {
  useComplianceAssignments,
  useComplianceTemplates,
  useUsers,
  useDeleteComplianceAssignment
} from '@/hooks/useComplianceAssignment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ComplianceAssignmentDashboardProps {
  className?: string;
}

export const ComplianceAssignmentDashboard: React.FC<ComplianceAssignmentDashboardProps> = ({
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: assignments = [] } = useComplianceAssignments({
    templateId: templateFilter === 'all' ? undefined : templateFilter,
    status: statusFilter === 'all' ? undefined : statusFilter === 'overdue' ? 'pending' : statusFilter
  });
  
  const { data: templates = [] } = useComplianceTemplates();
  const { data: users = [] } = useUsers();
  const deleteMutation = useDeleteComplianceAssignment();

  // Filter and process assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || assignment.priority === priorityFilter;

    // Handle overdue filter
    const isOverdue = assignment.due_date && 
      !assignment.is_completed && 
      isBefore(new Date(assignment.due_date), new Date());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'overdue' && isOverdue) ||
      (statusFilter === 'pending' && !assignment.is_completed && !isOverdue) ||
      (statusFilter === 'completed' && assignment.is_completed);

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.is_completed).length,
    pending: assignments.filter(a => !a.is_completed).length,
    overdue: assignments.filter(a => 
      a.due_date && 
      !a.is_completed && 
      isBefore(new Date(a.due_date), new Date())
    ).length,
    dueSoon: assignments.filter(a => 
      a.due_date && 
      !a.is_completed && 
      isAfter(new Date(a.due_date), new Date()) &&
      isBefore(new Date(a.due_date), addDays(new Date(), 7))
    ).length
  };

  const getStatusBadge = (assignment: any) => {
    if (assignment.is_completed) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    }
    
    if (assignment.due_date) {
      const isOverdue = isBefore(new Date(assignment.due_date), new Date());
      const isDueSoon = isAfter(new Date(assignment.due_date), new Date()) &&
        isBefore(new Date(assignment.due_date), addDays(new Date(), 7));
      
      if (isOverdue) {
        return <Badge variant="destructive">Overdue</Badge>;
      }
      if (isDueSoon) {
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Due Soon</Badge>;
      }
    }
    
    return <Badge variant="outline">Pending</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    return <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>{priority}</Badge>;
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteMutation.mutateAsync(assignmentId);
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const exportData = () => {
    const csv = [
      ['User Name', 'Email', 'Template', 'Status', 'Priority', 'Assigned Date', 'Due Date', 'Completed Date'].join(','),
      ...filteredAssignments.map(assignment => [
        assignment.user?.name || '',
        assignment.user?.email || '',
        templates.find(t => t.id === assignment.compliance_template_id)?.name || '',
        assignment.is_completed ? 'Completed' : 'Pending',
        assignment.priority || '',
        assignment.assigned_at ? format(parseISO(assignment.assigned_at), 'yyyy-MM-dd') : '',
        assignment.due_date ? format(parseISO(assignment.due_date), 'yyyy-MM-dd') : '',
        assignment.completion_date ? format(parseISO(assignment.completion_date), 'yyyy-MM-dd') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-assignments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-semibold text-amber-600">{stats.dueSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance Assignments</CardTitle>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'completed' | 'overdue') => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignment Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const template = templates.find(t => t.id === assignment.compliance_template_id);
                  
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{assignment.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{assignment.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{template?.name}</p>
                          {template?.jurisdiction && (
                            <Badge variant="outline" className="text-xs">
                              {template.jurisdiction}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(assignment)}</TableCell>
                      <TableCell>{getPriorityBadge(assignment.priority || 'medium')}</TableCell>
                      <TableCell>
                        {assignment.assigned_at ? format(parseISO(assignment.assigned_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {assignment.due_date ? format(parseISO(assignment.due_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {assignment.completion_date ? format(parseISO(assignment.completion_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this compliance assignment for {assignment.user?.name}? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No assignments found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || templateFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No compliance training assignments have been created yet'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceAssignmentDashboard;
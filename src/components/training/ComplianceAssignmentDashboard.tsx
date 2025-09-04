import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useComplianceAssignments, useComplianceTemplates, useDeleteComplianceAssignment } from '@/hooks/useComplianceAssignment';
import { format } from 'date-fns';
import { Trash2, Users, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

export const ComplianceAssignmentDashboard = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: assignments = [], isLoading } = useComplianceAssignments({
    status: statusFilter,
    templateId: templateFilter !== 'all' ? templateFilter : undefined,
  });
  
  const { data: templates = [] } = useComplianceTemplates();
  const deleteAssignment = useDeleteComplianceAssignment();

  const filteredAssignments = assignments.filter(assignment => {
    const searchLower = searchQuery.toLowerCase();
    return (
      assignment.user?.name?.toLowerCase().includes(searchLower) ||
      assignment.user?.email?.toLowerCase().includes(searchLower) ||
      assignment.compliance_training_templates?.title?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => !a.is_completed).length,
    completed: assignments.filter(a => a.is_completed).length,
    overdue: assignments.filter(a => {
      if (a.is_completed) return false;
      // Since we don't have due_date yet, we'll use created_at + 30 days as a placeholder
      const dueDate = new Date(a.created_at);
      dueDate.setDate(dueDate.getDate() + 30);
      return new Date() > dueDate;
    }).length,
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteAssignment.mutateAsync(assignmentId);
      } catch (error) {
        toast.error('Failed to delete assignment');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading compliance assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search by user or training..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'completed') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Training Type</label>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Training Types</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Assignments</CardTitle>
          <CardDescription>
            Manage and track compliance training assignments for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No assignments found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || templateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new compliance assignment'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {assignment.user?.name || 'Unknown User'}
                      </h3>
                      <Badge variant={assignment.is_completed ? 'default' : 'secondary'}>
                        {assignment.is_completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1">
                      {assignment.user?.email}
                    </p>
                    
                    <p className="text-sm font-medium text-foreground">
                      Training: {assignment.compliance_training_templates?.title || 'Unknown Training'}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Assigned: {format(new Date(assignment.created_at), 'MMM dd, yyyy')}</span>
                      {assignment.completion_date && (
                        <span>Completed: {format(new Date(assignment.completion_date), 'MMM dd, yyyy')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      disabled={deleteAssignment.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
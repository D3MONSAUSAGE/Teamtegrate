import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Users, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  UserMinus,
  Filter
} from 'lucide-react';
import { useComplianceAssignments, useComplianceTemplates, useDeleteComplianceAssignment } from '@/hooks/useComplianceAssignment';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';

interface AssignmentManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssignmentManagementDialog: React.FC<AssignmentManagementDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [bulkRemoveConfirmOpen, setBulkRemoveConfirmOpen] = useState(false);

  const { data: assignments = [], isLoading } = useComplianceAssignments({
    status: statusFilter,
    templateId: templateFilter !== 'all' ? templateFilter : undefined,
  });
  
  const { data: templates = [] } = useComplianceTemplates();
  const deleteAssignment = useDeleteComplianceAssignment();

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        assignment.user?.name?.toLowerCase().includes(searchLower) ||
        assignment.user?.email?.toLowerCase().includes(searchLower) ||
        assignment.compliance_training_templates?.title?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });
  }, [assignments, searchTerm]);

  // Statistics
  const stats = useMemo(() => ({
    total: filteredAssignments.length,
    pending: filteredAssignments.filter(a => !a.is_completed).length,
    completed: filteredAssignments.filter(a => a.is_completed).length,
    selected: selectedAssignments.length,
  }), [filteredAssignments, selectedAssignments]);

  // Handle individual assignment selection
  const handleAssignmentSelect = (assignmentId: string, checked: boolean) => {
    setSelectedAssignments(prev => 
      checked 
        ? [...prev, assignmentId]
        : prev.filter(id => id !== assignmentId)
    );
  };

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectedAssignments(
      checked ? filteredAssignments.map(a => a.id) : []
    );
  };

  // Handle single assignment removal
  const handleRemoveSingle = async (assignmentId: string) => {
    try {
      await deleteAssignment.mutateAsync(assignmentId);
      toast.success('Assignment removed successfully');
      setSelectedAssignments(prev => prev.filter(id => id !== assignmentId));
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  // Handle bulk assignment removal
  const handleBulkRemove = async () => {
    try {
      await Promise.all(
        selectedAssignments.map(id => deleteAssignment.mutateAsync(id))
      );
      toast.success(`Successfully removed ${selectedAssignments.length} assignment(s)`);
      setSelectedAssignments([]);
      setBulkRemoveConfirmOpen(false);
    } catch (error) {
      toast.error('Failed to remove some assignments');
    }
  };

  const getStatusBadge = (assignment: any) => {
    if (assignment.is_completed) {
      return <Badge variant="default">Completed</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Assignment Management Center
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Assignments</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Filter className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stats.selected}</p>
                    <p className="text-xs text-muted-foreground">Selected</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters and Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 mr-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search assignments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'completed') => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={templateFilter} onValueChange={setTemplateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Training Types" />
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

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkRemoveConfirmOpen(true)}
                  disabled={selectedAssignments.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Selected ({selectedAssignments.length})
                </Button>
              </div>
            </div>

            {/* Assignments List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Training Assignments</span>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedAssignments.length === filteredAssignments.length && filteredAssignments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">Select All</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading assignments...</p>
                  </div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No assignments found matching your filters</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {filteredAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                          <Checkbox
                            checked={selectedAssignments.includes(assignment.id)}
                            onCheckedChange={(checked) => handleAssignmentSelect(assignment.id, checked as boolean)}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{assignment.user?.name || 'Unknown User'}</h4>
                                {getStatusBadge(assignment)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSingle(assignment.id)}
                                disabled={deleteAssignment.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-1">
                              {assignment.user?.email}
                            </p>
                            
                            <p className="text-sm font-medium">
                              Training: {assignment.compliance_training_templates?.title || 'Unknown Training'}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>Assigned: {format(new Date(assignment.created_at), 'MMM dd, yyyy')}</span>
                              {assignment.completion_date && (
                                <span>Completed: {format(new Date(assignment.completion_date), 'MMM dd, yyyy')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Removal Confirmation */}
      <AlertDialog open={bulkRemoveConfirmOpen} onOpenChange={setBulkRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Multiple Assignments</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedAssignments.length} assignment(s)? 
              This action cannot be undone and will permanently delete all progress on these trainings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRemove}
              disabled={deleteAssignment.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAssignment.isPending ? 'Removing...' : 'Remove All Selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AssignmentManagementDialog;
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Users, 
  Archive,
  UserCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProgress } from '@/hooks/useTrainingData';
import { useUsers } from '@/hooks/useUsers';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentAction {
  type: 'archive' | 'reassign' | 'complete';
  assignmentIds: string[];
  newAssignee?: string;
}

const TrainingAssignmentManagement: React.FC = () => {
  const { user, hasRoleAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<AssignmentAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: employeeData = [], isLoading, refetch } = useEmployeeProgress();
  const { users } = useUsers();

  // Only show to admins and superadmins
  if (!user || !hasRoleAccess('admin')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Access denied. Admin privileges required.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Flatten all assignments from all employees
  const allAssignments = useMemo(() => {
    return employeeData.flatMap(employee => 
      employee.assignments.map(assignment => ({
        ...assignment,
        employeeName: employee.name,
        employeeEmail: employee.email,
        employeeId: employee.id
      }))
    );
  }, [employeeData]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter(assignment => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          assignment.content_title?.toLowerCase().includes(searchLower) ||
          assignment.employeeName?.toLowerCase().includes(searchLower) ||
          assignment.employeeEmail?.toLowerCase().includes(searchLower) ||
          assignment.assignment_type?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && assignment.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [allAssignments, searchTerm, selectedStatus]);

  const handleBulkAction = (actionType: AssignmentAction['type']) => {
    if (selectedAssignments.length === 0) {
      toast.error('Please select assignments to manage');
      return;
    }

    setPendingAction({
      type: actionType,
      assignmentIds: selectedAssignments
    });
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    
    setIsProcessing(true);
    
    try {
      const { type, assignmentIds } = pendingAction;
      
      switch (type) {
        case 'archive':
          // Archive assignments by setting status to archived
          const { error: archiveError } = await supabase
            .from('training_assignments')
            .update({ 
              status: 'archived',
              updated_at: new Date().toISOString()
            })
            .in('id', assignmentIds);
          
          if (archiveError) throw archiveError;
          toast.success(`${assignmentIds.length} assignment(s) archived successfully`);
          break;
          
        case 'complete':
          // Mark assignments as completed
          const { error: completeError } = await supabase
            .from('training_assignments')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .in('id', assignmentIds);
          
          if (completeError) throw completeError;
          toast.success(`${assignmentIds.length} assignment(s) marked as completed`);
          break;
          
        default:
          toast.error('Invalid action type');
          return;
      }
      
      // Refresh data
      await refetch();
      setSelectedAssignments([]);
      
    } catch (error) {
      console.error('Error processing bulk action:', error);
      toast.error('Failed to process bulk action');
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  const toggleAssignmentSelection = (assignmentId: string) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId)
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredAssignments.map(a => a.id);
    setSelectedAssignments(visibleIds);
  };

  const clearSelection = () => {
    setSelectedAssignments([]);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'overdue': return 'destructive';
      case 'archived': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading assignment data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Training Assignment Management</CardTitle>
            </div>
            <Button 
              onClick={() => refetch()} 
              size="sm" 
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters and Search */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search assignments or employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={selectAllVisible} 
                  size="sm" 
                  variant="outline"
                >
                  Select All
                </Button>
                <Button 
                  onClick={clearSelection} 
                  size="sm" 
                  variant="outline"
                  disabled={selectedAssignments.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedAssignments.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedAssignments.length} assignment(s) selected
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Button 
                    onClick={() => handleBulkAction('complete')}
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Complete
                  </Button>
                  <Button 
                    onClick={() => handleBulkAction('archive')}
                    size="sm"
                    variant="outline"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Assignments ({filteredAssignments.length} found)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedAssignments.includes(assignment.id)}
                        onChange={() => toggleAssignmentSelection(assignment.id)}
                        className="w-4 h-4 text-primary border-2 rounded focus:ring-primary"
                      />
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assignment.content_title}</span>
                          <Badge variant={getStatusBadgeVariant(assignment.status)}>
                            {assignment.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {assignment.assignment_type}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Assigned to: <span className="font-medium">{assignment.employeeName}</span> ({assignment.employeeEmail})
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Assigned: {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}</span>
                          {assignment.due_date && (
                            <span>Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}</span>
                          )}
                          {assignment.completed_at && (
                            <span>Completed: {format(new Date(assignment.completed_at), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredAssignments.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No assignments match your current filters</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'archive' && (
                <>Are you sure you want to archive {pendingAction.assignmentIds.length} assignment(s)? This will hide them from employee views but preserve the records.</>
              )}
              {pendingAction?.type === 'complete' && (
                <>Are you sure you want to mark {pendingAction.assignmentIds.length} assignment(s) as completed? This cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TrainingAssignmentManagement;
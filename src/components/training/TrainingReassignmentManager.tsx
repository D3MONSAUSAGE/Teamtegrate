import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowRight, 
  Search, 
  Filter, 
  BookOpen, 
  PenTool,
  User,
  Calendar,
  Target,
  AlertCircle,
  RefreshCw,
  Users
} from 'lucide-react';
import { useSearchAssignments, useBulkReassignTraining, useCanReassignTraining } from '@/hooks/useTrainingReassignment';
import { format, parseISO, isAfter } from 'date-fns';
import ReassignTrainingDialog from './ReassignTrainingDialog';

interface TrainingReassignmentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TrainingReassignmentManager: React.FC<TrainingReassignmentManagerProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    assignmentType: 'all',
    priority: 'all'
  });
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);

  const { canReassign } = useCanReassignTraining();
  const { data: assignments = [], isLoading, refetch } = useSearchAssignments(searchTerm, filters);
  const bulkReassignMutation = useBulkReassignTraining();

  const handleAssignmentSelect = (assignmentId: string) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssignments.length === assignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(assignments.map(a => a.id));
    }
  };

  const handleIndividualReassign = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsReassignDialogOpen(true);
  };

  const getStatusColor = (status: string, dueDate?: string) => {
    const isOverdue = dueDate && isAfter(new Date(), parseISO(dueDate)) && status !== 'completed';
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-300';
    
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'reassigned': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const renderAssignment = (assignment: any) => {
    const isOverdue = assignment.due_date && 
      isAfter(new Date(), parseISO(assignment.due_date)) && 
      assignment.status !== 'completed';
    const displayStatus = isOverdue ? 'overdue' : assignment.status;

    return (
      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
          <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedAssignments.includes(assignment.id)}
                  onCheckedChange={() => handleAssignmentSelect(assignment.id)}
                />
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  {assignment.assignment_type === 'course' ? (
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  ) : (
                    <PenTool className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{assignment.content_title}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {assignment.assignment_type}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getStatusColor(assignment.status, assignment.due_date)}>
                  {displayStatus === 'overdue' ? 'Overdue' : displayStatus.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(assignment.priority)}>
                  {assignment.priority} priority
                </Badge>
              </div>
            </div>

            {/* Assignee Info */}
            <div className="flex items-center gap-3">
              <div className="p-1 rounded bg-gray-100">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {assignment.assigned_to_user?.name || 'Unknown User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {assignment.assigned_to_user?.email} • {assignment.assigned_to_user?.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Assigned: {format(parseISO(assignment.assigned_at), 'MMM d, yyyy')}
              </div>
              {assignment.due_date && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Due: {format(parseISO(assignment.due_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleIndividualReassign(assignment)}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Reassign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!canReassign) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have permission to manage training reassignments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Training Reassignment Manager</h2>
            <p className="text-muted-foreground">
              Search and reassign training assignments to different users
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search assignments, users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="reassigned">Reassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={filters.assignmentType} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, assignmentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="course">Courses</SelectItem>
                    <SelectItem value="quiz">Quizzes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={filters.priority} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {assignments.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedAssignments.length === assignments.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    Select All ({selectedAssignments.length}/{assignments.length} selected)
                  </span>
                </div>
                {selectedAssignments.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      // For bulk reassignment, we'd need another dialog
                      console.log('Bulk reassign:', selectedAssignments);
                    }}
                  >
                    <Users className="h-4 w-4" />
                    Bulk Reassign ({selectedAssignments.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Results ({assignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading assignments...</p>
              </div>
            ) : assignments.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {assignments.map(renderAssignment)}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assignments found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reassignment Dialog */}
      <ReassignTrainingDialog
        open={isReassignDialogOpen}
        onOpenChange={setIsReassignDialogOpen}
        assignment={selectedAssignment}
      />
    </>
  );
};

export default TrainingReassignmentManager;
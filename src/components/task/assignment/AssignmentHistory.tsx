import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { History, User, Users, Calendar, FileText } from 'lucide-react';
import { EnhancedTaskAssignmentService } from '@/services/EnhancedTaskAssignmentService';
import { format } from 'date-fns';

interface AssignmentHistoryProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AssignmentHistory: React.FC<AssignmentHistoryProps> = ({
  taskId,
  open,
  onOpenChange
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && taskId) {
      fetchHistory();
    }
  }, [open, taskId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await EnhancedTaskAssignmentService.getAssignmentHistory(taskId);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'team':
        return <Users className="h-4 w-4" />;
      case 'multiple':
        return <Users className="h-4 w-4" />;
      case 'individual':
        return <User className="h-4 w-4" />;
      case 'unassigned':
        return <User className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getAssignmentSummary = (record: any) => {
    if (record.assignment_type === 'unassigned') {
      return 'Task unassigned';
    }

    const newAssignment = record.new_assignment;
    if (newAssignment?.assigned_to_team_name) {
      return `Assigned to team: ${newAssignment.assigned_to_team_name}`;
    }

    if (newAssignment?.assigned_to_names && newAssignment.assigned_to_names.length > 0) {
      const names = newAssignment.assigned_to_names;
      if (names.length === 1) {
        return `Assigned to: ${names[0]}`;
      }
      return `Assigned to ${names.length} users: ${names.slice(0, 2).join(', ')}${names.length > 2 ? '...' : ''}`;
    }

    if (newAssignment?.assigned_to_name) {
      return `Assigned to: ${newAssignment.assigned_to_name}`;
    }

    return 'Assignment changed';
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'manual':
        return 'default';
      case 'project_inherited':
        return 'secondary';
      case 'team_inherited':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
          </DialogTitle>
          <DialogDescription>
            View all assignment changes for this task
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading history...</div>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((record, index) => (
                <Card key={record.id} className={index === 0 ? 'border-primary/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Assignment Type Icon */}
                      <div className="p-2 rounded-full bg-muted/50 mt-1">
                        {getAssignmentTypeIcon(record.assignment_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {getAssignmentSummary(record)}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getSourceBadgeVariant(record.assignment_source)}>
                                {record.assignment_source?.replace('_', ' ')}
                              </Badge>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground text-right">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(record.created_at), 'MMM d, yyyy')}
                            </div>
                            <div className="mt-1">
                              {format(new Date(record.created_at), 'h:mm a')}
                            </div>
                          </div>
                        </div>

                        {/* Assigned By */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {record.assigned_by_user?.name?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            by {record.assigned_by_user?.name || record.assigned_by_user?.email || 'Unknown'}
                          </span>
                        </div>

                        {/* Notes */}
                        {record.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                            <FileText className="h-3 w-3 inline mr-1" />
                            {record.notes}
                          </div>
                        )}

                        {/* Assignment Details */}
                        {record.new_assignment && record.assignment_type !== 'unassigned' && (
                          <div className="text-xs text-muted-foreground pl-4 border-l-2 border-muted">
                            {record.new_assignment.assigned_to_team_name && (
                              <div>Team: {record.new_assignment.assigned_to_team_name}</div>
                            )}
                            {record.new_assignment.assigned_to_names && (
                              <div>Users: {record.new_assignment.assigned_to_names.join(', ')}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div>No assignment history found</div>
              <div className="text-sm">This task hasn't been assigned yet</div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentHistory;
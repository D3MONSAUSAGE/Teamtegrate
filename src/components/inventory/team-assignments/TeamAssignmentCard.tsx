import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  FileText,
  User
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { TeamInventoryAssignment, InventoryTemplate } from '@/contexts/inventory/types';

interface TeamAssignmentCardProps {
  assignment: TeamInventoryAssignment;
  template?: InventoryTemplate;
  team?: any;
  onStatusChange?: (assignmentId: string, newStatus: string) => void;
  onDelete?: (assignmentId: string) => void;
  onViewDetails?: (assignmentId: string) => void;
}

export const TeamAssignmentCard: React.FC<TeamAssignmentCardProps> = ({
  assignment,
  template,
  team,
  onStatusChange,
  onDelete,
  onViewDetails
}) => {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;
    
    setLoading(true);
    try {
      await onStatusChange(assignment.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this assignment?')) return;
    
    setLoading(true);
    try {
      await onDelete(assignment.id);
    } catch (error) {
      console.error('Error deleting assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress (mock calculation for now)
  // Mock status and due date since they don't exist on the type yet
  const mockStatus = assignment.is_active ? 'active' : 'completed';
  const progress = mockStatus === 'completed' ? 100 : 
                  mockStatus === 'active' ? Math.random() * 60 + 20 : 0;

  const dueDate = null; // No due_date field available yet
  const isOverdue = false; // No status check possible yet

  return (
    <Card className={`relative ${isOverdue ? 'border-destructive' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {template?.name || 'Unknown Template'}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {team?.name || 'Unknown Team'}
              {team?.member_count && (
                <span>({team.member_count} members)</span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewDetails?.(assignment.id)}>
                <FileText className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              
              {!assignment.is_active && (
                <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Assignment
                </DropdownMenuItem>
              )}
              
              {assignment.is_active && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Assignment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={getPriorityColor('medium')} className="text-xs">
            medium priority
          </Badge>
          <Badge variant="outline" className="text-xs">
            <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(mockStatus)}`} />
            {mockStatus}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Progress Bar */}
        {assignment.is_active && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Assignment Details */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Assigned {formatDistanceToNow(new Date(assignment.created_at))} ago</span>
          </div>
          
          {assignment.assigned_by && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>By {assignment.assigned_by}</span>
            </div>
          )}

          {dueDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                Due {format(dueDate, 'MMM dd, yyyy')}
              </span>
            </div>
          )}

          {/* Recurring indicator - field not available yet */}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {!assignment.is_active && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => handleStatusChange('active')}
              disabled={loading}
            >
              <Play className="h-3 w-3 mr-1" />
              Start Count
            </Button>
          )}
          
          {assignment.is_active && (
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => onViewDetails?.(assignment.id)}
            >
              <FileText className="h-3 w-3 mr-1" />
              Continue Count
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
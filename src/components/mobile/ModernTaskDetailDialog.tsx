
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Star
} from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import MobileDialogWrapper from './MobileDialogWrapper';
import TaskTimer from '@/components/task/TaskTimer';

interface ModernTaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const ModernTaskDetailDialog: React.FC<ModernTaskDetailDialogProps> = ({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete
}) => {
  const { updateTaskStatus, deleteTask } = useTask();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'timer'>('details');

  if (!task) return null;

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'To Do':
        return { 
          color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          icon: Clock
        };
      case 'In Progress':
        return { 
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
          icon: Play
        };
      case 'Completed':
        return { 
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
          icon: CheckCircle2
        };
      default:
        return { 
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
          icon: Clock
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { 
          color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
          icon: AlertTriangle
        };
      case 'medium':
        return { 
          color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
          icon: Star
        };
      case 'low':
        return { 
          color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
          icon: Star
        };
      default:
        return { 
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
          icon: Star
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      toast.success('Task status updated successfully');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isUpdating) return;
    
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setIsUpdating(true);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted successfully');
      onOpenChange(false);
      onDelete?.(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: Calendar },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'timer', label: 'Timer', icon: Clock }
  ];

  return (
    <MobileDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={task.title}
      subtitle={`${task.status} • ${task.priority} Priority`}
      variant="bottom-sheet"
      className="flex flex-col"
    >
      {/* Status Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center gap-3 mb-4">
          <Badge className={cn("px-3 py-1.5 border font-medium", statusConfig.color)}>
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {task.status}
          </Badge>
          <Badge className={cn("px-3 py-1.5 border font-medium", priorityConfig.color)}>
            <PriorityIcon className="h-3.5 w-3.5 mr-1.5" />
            {task.priority}
          </Badge>
          {isOverdue && (
            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 px-3 py-1.5 border font-medium">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              Overdue
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
            <Button
              key={status}
              variant={task.status === status ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(status)}
              disabled={isUpdating || task.status === status}
              className={cn(
                "text-xs h-9 transition-all duration-200",
                task.status === status && "shadow-md"
              )}
            >
              {isUpdating ? '...' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border/50 bg-muted/20">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary bg-background/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1 px-6">
        {activeTab === 'details' && (
          <div className="py-6 space-y-6">
            {/* Metadata Cards */}
            <div className="grid grid-cols-1 gap-4">
              {task.deadline && (
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-lg font-semibold text-foreground">
                        {format(new Date(task.deadline), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {task.userId && (
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-lg font-semibold text-foreground">
                        {task.userId}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  Description
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                  {task.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onEdit?.(task)}
                disabled={isUpdating}
                className="flex-1 h-12 text-base font-medium"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isUpdating}
                className="flex-1 h-12 text-base font-medium text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="py-6 space-y-4">
            {/* Add Comment */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base"
                rows={4}
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => {
                    if (newComment.trim()) {
                      // TODO: Add comment functionality
                      setNewComment('');
                      toast.success('Comment added');
                    }
                  }}
                  disabled={!newComment.trim() || isUpdating}
                  className="h-10 px-6"
                >
                  Add Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-base font-medium">No comments yet</p>
              <p className="text-sm">Be the first to add a comment!</p>
            </div>
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="py-6">
            <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-6 border border-border/50">
              <TaskTimer 
                taskId={task.id} 
                taskTitle={task.title}
                compact={false}
                showControls={true}
              />
            </div>
          </div>
        )}
      </ScrollArea>
    </MobileDialogWrapper>
  );
};

export default ModernTaskDetailDialog;

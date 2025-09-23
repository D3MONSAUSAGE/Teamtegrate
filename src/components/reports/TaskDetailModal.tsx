import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, FileText, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { format } from 'date-fns';
import { DailyTaskDetail } from '@/components/reports/weekly/DailyTaskDetailView';

interface TaskDetailModalProps {
  task: DailyTaskDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'destructive';
    case 'Medium': return 'default';
    case 'Low': return 'secondary';
    default: return 'outline';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'In Progress': return <Clock className="h-4 w-4 text-primary" />;
    case 'To Do': return <Target className="h-4 w-4 text-muted-foreground" />;
    default: return <AlertTriangle className="h-4 w-4 text-warning" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return 'bg-success/10 text-success border-success/20';
    case 'In Progress': return 'bg-primary/10 text-primary border-primary/20';
    case 'To Do': return 'bg-muted text-muted-foreground border-border';
    default: return 'bg-warning/10 text-warning border-warning/20';
  }
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose
}) => {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold pr-8">
            {task.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(task.status)}`}>
            <span className="flex items-center">{getStatusIcon(task.status)}</span>
            <span className="text-sm font-medium">{task.status}</span>
          </div>
            <Badge variant={getPriorityColor(task.priority)} className="font-medium">
              {task.priority} Priority
            </Badge>
          </div>
          
          <Separator />
          
          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project */}
            {task.project_title && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Project</p>
                  <p className="text-sm text-muted-foreground">{task.project_title}</p>
                </div>
              </div>
            )}
            
            {/* Created Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(task.created_at), 'PPP')}
                </p>
              </div>
            </div>
            
            {/* Deadline */}
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(task.deadline), 'PPP')}
                </p>
              </div>
            </div>
            
            {/* Completion Time */}
            {task.completed_at && (
              <div className="flex items-center gap-3">
                <span className="flex items-center"><CheckCircle className="h-4 w-4 text-success" /></span>
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(task.completed_at), 'PPP p')}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Assignment Info (if available) */}
          {(task as any).assigned_to_name && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Assigned To</p>
                  <p className="text-sm text-muted-foreground">{(task as any).assigned_to_name}</p>
                  {(task as any).assigned_by_name && (
                    <p className="text-xs text-muted-foreground">
                      Assigned by: {(task as any).assigned_by_name}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Description */}
          {task.description && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {task.description}
                </p>
              </div>
            </>
          )}
          
          {/* Task ID (for reference) */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            Task ID: {task.task_id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
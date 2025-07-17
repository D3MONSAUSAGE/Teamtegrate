
import React, { useState } from 'react';
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  CalendarIcon, 
  Clock, 
  AlertCircle, 
  MessageCircle,
  CheckCircle2,
  X,
  User,
  Edit3,
  Flag,
  Calendar,
  Timer,
  Users,
  ArrowRight,
  Repeat,
  ExternalLink,
  Play
} from 'lucide-react';
import TaskCommentForm from "@/components/TaskCommentForm";
import TaskCommentsList from "@/components/TaskCommentsList";
import { useTaskDetailUtils } from './task-detail/useTaskDetailUtils';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { useEnhancedTimeTracking } from '@/hooks/useEnhancedTimeTracking';
import { toast } from 'sonner';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  open,
  onOpenChange
}) => {
  const { updateTaskStatus } = useTask();
  const [isEditing, setIsEditing] = useState(false);
  const { clockIn, sessionState } = useEnhancedTimeTracking();

  if (!task) return null;
  
  const {
    getStatusColor,
    getPriorityColor,
    isOverdue,
    formatDate,
    formatTime
  } = useTaskDetailUtils(task);

  const handleStatusChange = (status: 'To Do' | 'In Progress' | 'Completed') => {
    updateTaskStatus(task.id, status);
  };

  const handleStartWorking = async () => {
    try {
      // First update task status to In Progress
      await updateTaskStatus(task.id, 'In Progress');
      
      // Then start time tracking session
      await clockIn(`Working on: ${task.title}`);
      
      toast.success('Started working on task and began time tracking');
    } catch (error) {
      console.error('Error starting work session:', error);
      toast.error('Failed to start work session');
    }
  };

  const getDeadlineInfo = () => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const daysLeft = differenceInDays(deadline, now);
    const hoursLeft = differenceInHours(deadline, now);
    
    if (isOverdue) {
      return { text: `Overdue by ${Math.abs(daysLeft)} days`, color: 'text-rose-600', urgent: true };
    } else if (daysLeft === 0) {
      return { text: `Due in ${hoursLeft} hours`, color: 'text-amber-600', urgent: true };
    } else if (daysLeft <= 3) {
      return { text: `Due in ${daysLeft} days`, color: 'text-amber-600', urgent: false };
    } else {
      return { text: `Due in ${daysLeft} days`, color: 'text-muted-foreground', urgent: false };
    }
  };

  const deadlineInfo = getDeadlineInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] overflow-hidden p-0 flex flex-col">
        {/* Header - Fixed */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/30 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-xl font-semibold pr-8 leading-tight">
                {task.title}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(task.status)} variant="secondary">
                  {task.status}
                </Badge>
                <Badge className={getPriorityColor(task.priority)} variant="outline">
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority}
                </Badge>
                {deadlineInfo.urgent && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="shrink-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Description */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm leading-relaxed whitespace-pre-line p-3 rounded-md bg-muted/50 border min-h-[60px]">
                    {task.description || (
                      <em className="text-muted-foreground">No description provided.</em>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline & Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline & Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Due Date</div>
                        <div className="font-medium text-sm">{formatDate(task.deadline)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Due Time</div>
                        <div className="font-medium text-sm">{formatTime(task.deadline)}</div>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                    deadlineInfo.urgent ? 'bg-rose-50 border-rose-200' : 'bg-muted/30'
                  }`}>
                    <Timer className={`h-4 w-4 ${deadlineInfo.color}`} />
                    <span className={`font-medium text-sm ${deadlineInfo.color}`}>
                      {deadlineInfo.text}
                    </span>
                  </div>

                  {task.cost && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-green-600 font-medium text-sm">💰 Cost: ${task.cost}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Comments ({task.comments?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.comments && task.comments.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto">
                      <TaskCommentsList 
                        taskComments={task.comments} 
                        className="space-y-2" 
                      />
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <MessageCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet</p>
                    </div>
                  )}
                  
                  <Separator />
                  <TaskCommentForm taskId={task.id} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Assignment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {task.assignedToName ? (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {task.assignedToName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{task.assignedToName}</div>
                        <div className="text-xs text-muted-foreground">Assignee</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted-foreground">
                      <User className="h-5 w-5 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Unassigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status Actions */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </div>
                    
                    {task.status !== 'Completed' && (
                      <Button 
                        onClick={() => handleStatusChange('Completed')} 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    
                    {task.status === 'Completed' && (
                      <Button
                        onClick={() => handleStatusChange('To Do')}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Mark Incomplete
                      </Button>
                    )}

                    {task.status === 'To Do' && (
                      <Button
                        onClick={handleStartWorking}
                        variant="outline"
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                        size="sm"
                        disabled={sessionState.isActive}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {sessionState.isActive ? 'Already Working' : 'Start Working'}
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Additional Actions */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Repeat className="h-4 w-4 mr-2" />
                      Make Recurring
                    </Button>
                    
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View in Project
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Task Metadata */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Task Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {format(new Date(task.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {format(new Date(task.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  {task.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium text-green-600">
                        {format(new Date(task.completedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Task ID</span>
                    <span className="font-mono text-xs">{task.id.slice(0, 8)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-4 py-3 border-t bg-muted/20 flex justify-end shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;

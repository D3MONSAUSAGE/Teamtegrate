import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  CheckSquare, 
  FolderPlus,
  Calendar,
  Users,
  ArrowRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeetingRequestWithParticipants } from '@/types/meeting';

interface QuickAction {
  id: string;
  title: string;
  description?: string;
  type: 'task' | 'project' | 'meeting';
  assignees?: string[];
  dueDate?: Date;
  projectId?: string;
}

interface MeetingQuickActionsProps {
  meeting: MeetingRequestWithParticipants;
  onCreateTask?: (task: Partial<QuickAction>) => void;
  onCreateProject?: (project: Partial<QuickAction>) => void;
  onScheduleFollowUp?: (meeting: Partial<QuickAction>) => void;
  className?: string;
}

export const MeetingQuickActions: React.FC<MeetingQuickActionsProps> = ({
  meeting,
  onCreateTask,
  onCreateProject,  
  onScheduleFollowUp,
  className
}) => {
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickProjectTitle, setQuickProjectTitle] = useState('');
  const [pendingActions, setPendingActions] = useState<QuickAction[]>([]);

  const createQuickTask = () => {
    if (!quickTaskTitle.trim()) return;

    const task: QuickAction = {
      id: Date.now().toString(),
      title: quickTaskTitle.trim(),
      type: 'task',
      assignees: meeting.participants?.map(p => p.user_id) || [],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    };

    setPendingActions(prev => [...prev, task]);
    onCreateTask?.(task);
    setQuickTaskTitle('');
  };

  const createQuickProject = () => {
    if (!quickProjectTitle.trim()) return;

    const project: QuickAction = {
      id: Date.now().toString(),
      title: quickProjectTitle.trim(),
      type: 'project',
      description: `Project created from meeting: ${meeting.title}`,
      assignees: meeting.participants?.map(p => p.user_id) || []
    };

    setPendingActions(prev => [...prev, project]);
    onCreateProject?.(project);
    setQuickProjectTitle('');
  };

  const scheduleFollowUp = () => {
    const followUp: QuickAction = {
      id: Date.now().toString(),
      title: `Follow-up: ${meeting.title}`,
      type: 'meeting',
      description: 'Follow-up meeting to review action items and progress',
      assignees: meeting.participants?.map(p => p.user_id) || [],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    };

    setPendingActions(prev => [...prev, followUp]);
    onScheduleFollowUp?.(followUp);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'task': return CheckSquare;
      case 'project': return FolderPlus;
      case 'meeting': return Calendar;
      default: return Plus;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'project': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'meeting': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
          <Badge variant="outline" className="text-xs">
            {meeting.participants?.length || 0} participants
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Task Creation */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Create Task
          </h4>
          
          <div className="flex gap-2">
            <Input
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="Task title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createQuickTask();
                }
              }}
            />
            <Button
              onClick={createQuickTask}
              disabled={!quickTaskTitle.trim()}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Create
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Task will be assigned to all meeting participants
          </p>
        </div>

        <Separator />

        {/* Quick Project Creation */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <FolderPlus className="h-4 w-4" />
            Create Project
          </h4>
          
          <div className="flex gap-2">
            <Input
              value={quickProjectTitle}
              onChange={(e) => setQuickProjectTitle(e.target.value)}
              placeholder="Project title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createQuickProject();
                }
              }}
            />
            <Button
              onClick={createQuickProject}
              disabled={!quickProjectTitle.trim()}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Create
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Project team will include all meeting participants
          </p>
        </div>

        <Separator />

        {/* Schedule Follow-up */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Follow-up
          </h4>
          
          <Button
            onClick={scheduleFollowUp}
            variant="outline"
            className="w-full gap-2"
          >
            <Calendar className="h-4 w-4" />
            Schedule Follow-up Meeting
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Creates a follow-up meeting with the same participants in 1 week
          </p>
        </div>

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Created Actions
              </h4>
              
              <div className="space-y-2">
                {pendingActions.slice(-3).map((action) => {
                  const Icon = getActionIcon(action.type);
                  return (
                    <div
                      key={action.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded border text-sm",
                        getActionColor(action.type)
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 font-medium">{action.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {action.type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              
              {pendingActions.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{pendingActions.length - 3} more actions created
                </p>
              )}
            </div>
          </>
        )}

        {/* Meeting Context Info */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{meeting.title}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{meeting.participants?.length || 0} participants</span>
            
            {meeting.start_time && (
              <>
                <span>•</span>
                <span>{new Date(meeting.start_time).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
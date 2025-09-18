import React from 'react';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Task } from '@/types';

interface TaskSyncIndicatorProps {
  task: Task;
  isGoogleCalendarConnected?: boolean;
}

const TaskSyncIndicator: React.FC<TaskSyncIndicatorProps> = ({ 
  task, 
  isGoogleCalendarConnected = false 
}) => {
  // Check if task has any Google Calendar sync data
  const hasDeadlineSync = !!(task as any).google_event_id_deadline;
  const hasFocusTimeSync = !!(task as any).google_event_id_focus_time;
  const hasReminderSync = !!(task as any).google_event_id_reminder;
  
  const syncCount = [hasDeadlineSync, hasFocusTimeSync, hasReminderSync].filter(Boolean).length;

  if (!isGoogleCalendarConnected) {
    return null;
  }

  if (syncCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Synced
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Task not synced to Google Calendar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const syncTypes = [];
  if (hasDeadlineSync) syncTypes.push('Deadline');
  if (hasFocusTimeSync) syncTypes.push('Focus Time');
  if (hasReminderSync) syncTypes.push('Reminder');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
            <Calendar className="h-3 w-3 mr-1" />
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {syncCount} Synced
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div>
            <p className="font-medium">Synced to Google Calendar:</p>
            <ul className="text-xs mt-1">
              {syncTypes.map(type => (
                <li key={type}>• {type}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TaskSyncIndicator;
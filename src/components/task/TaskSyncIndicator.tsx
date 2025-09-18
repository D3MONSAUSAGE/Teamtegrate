import React from 'react';
import { Calendar, CheckCircle2, AlertCircle, CheckSquare, Repeat } from 'lucide-react';
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
  
  // Check if task has Google Tasks sync
  const hasGoogleTasksSync = !!(task as any).google_tasks_id;
  
  const calendarSyncCount = [hasDeadlineSync, hasFocusTimeSync, hasReminderSync].filter(Boolean).length;
  const totalSyncCount = calendarSyncCount + (hasGoogleTasksSync ? 1 : 0);

  // Determine task source
  const source = (task as any).source || 'local';

  if (!isGoogleCalendarConnected) {
    return null;
  }

  const getSourceIcon = () => {
    switch (source) {
      case 'google_tasks':
        return <CheckSquare className="h-3 w-3" />;
      case 'google_calendar':
        return <Calendar className="h-3 w-3" />;
      case 'hybrid':
        return <Repeat className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getSourceColor = () => {
    switch (source) {
      case 'google_tasks':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'google_calendar':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'hybrid':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (totalSyncCount === 0 && source === 'local') {
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
            <p>Task not synced to Google services</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const syncTypes = [];
  if (hasDeadlineSync) syncTypes.push('Deadline');
  if (hasFocusTimeSync) syncTypes.push('Focus Time');
  if (hasReminderSync) syncTypes.push('Reminder');
  if (hasGoogleTasksSync) syncTypes.push('Google Tasks');

  const getSourceLabel = () => {
    switch (source) {
      case 'google_tasks':
        return 'Google Tasks';
      case 'google_calendar':
        return 'Google Calendar';
      case 'hybrid':
        return 'Hybrid Sync';
      default:
        return 'Local';
    }
  };

  return (
    <div className="flex gap-1">
      {/* Source indicator */}
      {source !== 'local' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={`text-xs ${getSourceColor()}`}>
                {getSourceIcon()}
                {getSourceLabel()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Task source: {getSourceLabel()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Sync status indicator */}
      {totalSyncCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {totalSyncCount} Synced
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p className="font-medium">Synced to Google:</p>
                <ul className="text-xs mt-1">
                  {syncTypes.map(type => (
                    <li key={type}>• {type}</li>
                  ))}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default TaskSyncIndicator;
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Clock, MapPin, Check, X, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { MeetingStatusSummary } from './MeetingStatusSummary';

interface CompactMeetingIndicatorProps {
  meetings: MeetingRequestWithParticipants[];
  onClick?: () => void;
}

export const CompactMeetingIndicator: React.FC<CompactMeetingIndicatorProps> = ({
  meetings,
  onClick
}) => {
  if (meetings.length === 0) return null;

  const firstMeeting = meetings[0];
  const hasMultiple = meetings.length > 1;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 text-xs px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            onClick={onClick}
          >
            <Users className="h-3 w-3 mr-1" />
            {hasMultiple ? `${meetings.length} meetings` : firstMeeting.title}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md">
          <div className="space-y-3">
            {meetings.slice(0, 3).map((meeting) => (
              <div key={meeting.id} className="text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0">
                <div className="font-medium mb-1">{meeting.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Clock className="h-3 w-3" />
                  {format(new Date(meeting.start_time), 'h:mm a')} - {format(new Date(meeting.end_time), 'h:mm a')}
                  {meeting.location && (
                    <>
                      <MapPin className="h-3 w-3 ml-1" />
                      {meeting.location}
                    </>
                  )}
                </div>
                <MeetingStatusSummary 
                  participants={meeting.participants || []} 
                  compact={true}
                  showTrend={true}
                />
              </div>
            ))}
            {meetings.length > 3 && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                +{meetings.length - 3} more meeting{meetings.length - 3 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
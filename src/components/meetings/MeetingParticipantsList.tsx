import React from 'react';
import { Check, Clock, X, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { MeetingParticipant } from '@/types/meeting';

interface MeetingParticipantsListProps {
  participants: MeetingParticipant[];
  organizerName?: string;
  compact?: boolean;
  showAvatars?: boolean;
}

export const MeetingParticipantsList: React.FC<MeetingParticipantsListProps> = ({
  participants,
  organizerName,
  compact = false,
  showAvatars = true,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-3 w-3" />;
      case 'declined':
        return <X className="h-3 w-3" />;
      case 'tentative':
        return <UserCheck className="h-3 w-3" />;
      case 'invited':
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'declined':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'tentative':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'invited':
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'tentative':
        return 'Tentative';
      case 'invited':
      default:
        return 'Pending';
    }
  };

  // Group participants by status
  const groupedParticipants = participants.reduce((acc, participant) => {
    const status = participant.response_status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(participant);
    return acc;
  }, {} as Record<string, MeetingParticipant[]>);

  const statusCounts = {
    accepted: groupedParticipants.accepted?.length || 0,
    declined: groupedParticipants.declined?.length || 0,
    tentative: groupedParticipants.tentative?.length || 0,
    invited: groupedParticipants.invited?.length || 0,
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{participants.length} invited</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        {statusCounts.accepted > 0 && (
          <Badge variant="secondary" className={cn("text-xs", getStatusColor('accepted'))}>
            <Check className="h-3 w-3 mr-1" />
            {statusCounts.accepted}
          </Badge>
        )}
        {statusCounts.tentative > 0 && (
          <Badge variant="secondary" className={cn("text-xs", getStatusColor('tentative'))}>
            <UserCheck className="h-3 w-3 mr-1" />
            {statusCounts.tentative}
          </Badge>
        )}
        {statusCounts.declined > 0 && (
          <Badge variant="secondary" className={cn("text-xs", getStatusColor('declined'))}>
            <X className="h-3 w-3 mr-1" />
            {statusCounts.declined}
          </Badge>
        )}
        {statusCounts.invited > 0 && (
          <Badge variant="secondary" className={cn("text-xs", getStatusColor('invited'))}>
            <Clock className="h-3 w-3 mr-1" />
            {statusCounts.invited}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Participants ({participants.length})</h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", getStatusColor('accepted'))}>
            {statusCounts.accepted} Accepted
          </Badge>
          <Badge variant="outline" className={cn("text-xs", getStatusColor('invited'))}>
            {statusCounts.invited} Pending
          </Badge>
          {statusCounts.declined > 0 && (
            <Badge variant="outline" className={cn("text-xs", getStatusColor('declined'))}>
              {statusCounts.declined} Declined
            </Badge>
          )}
        </div>
      </div>

      {/* Participants List */}
      <div className="space-y-3">
        {Object.entries(groupedParticipants).map(([status, statusParticipants]) => (
          <div key={status} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={cn("text-xs font-medium", getStatusColor(status))}
              >
                {getStatusIcon(status)}
                <span className="ml-1">{getStatusLabel(status)}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">
                {statusParticipants.length} participant{statusParticipants.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
              {statusParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                >
                  {showAvatars && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">
                        {participant.user_id.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-sm truncate">
                    {/* We'd need to join with users table to get actual names */}
                    User {participant.user_id.slice(0, 8)}...
                  </span>
                  {participant.responded_at && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(participant.responded_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {organizerName && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Organized by {organizerName}</span>
          </div>
        </div>
      )}
    </div>
  );
};
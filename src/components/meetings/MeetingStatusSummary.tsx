import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, X, UserCheck, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MeetingParticipant } from '@/types/meeting';

interface MeetingStatusSummaryProps {
  participants: MeetingParticipant[];
  compact?: boolean;
  showTrend?: boolean;
}

export const MeetingStatusSummary: React.FC<MeetingStatusSummaryProps> = ({
  participants,
  compact = false,
  showTrend = false
}) => {
  const statusCounts = participants.reduce((acc, participant) => {
    const status = participant.response_status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = participants.length;
  const confirmed = statusCounts.accepted || 0;
  const pending = statusCounts.invited || 0;
  const declined = statusCounts.declined || 0;
  const tentative = statusCounts.tentative || 0;

  const confirmationRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const responseRate = total > 0 ? Math.round(((confirmed + declined + tentative) / total) * 100) : 0;

  const statusConfigs = {
    accepted: {
      count: confirmed,
      icon: Check,
      label: 'Confirmed',
      color: 'bg-meeting-confirmed text-meeting-confirmed-foreground border-meeting-confirmed/30 hover:bg-meeting-confirmed/90'
    },
    tentative: {
      count: tentative,
      icon: UserCheck,
      label: 'Tentative',
      color: 'bg-meeting-tentative text-meeting-tentative-foreground border-meeting-tentative/30 hover:bg-meeting-tentative/90'
    },
    declined: {
      count: declined,
      icon: X,
      label: 'Declined',
      color: 'bg-meeting-declined text-meeting-declined-foreground border-meeting-declined/30 hover:bg-meeting-declined/90'
    },
    invited: {
      count: pending,
      icon: Clock,
      label: 'Pending',
      color: 'bg-meeting-pending text-meeting-pending-foreground border-meeting-pending/30 hover:bg-meeting-pending/90'
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 text-sm font-medium">
          <Users className="h-4 w-4" />
          <span>{total} invited</span>
        </div>
        
        {/* Prominent status breakdown */}
        <div className="flex items-center gap-2">
          {Object.entries(statusConfigs).map(([status, config]) => {
            if (config.count === 0) return null;
            const Icon = config.icon;
            return (
              <Badge 
                key={status}
                variant="outline" 
                className={cn("gap-1 transition-colors font-medium", config.color)}
              >
                <Icon className="h-3 w-3" />
                {config.count} {config.label}
              </Badge>
            );
          })}
        </div>

        {/* Response rate badge */}
        <Badge 
          variant="outline" 
          className={cn(
            "gap-1 font-medium",
            responseRate >= 80 ? "bg-success/10 text-success border-success/30" :
            responseRate >= 50 ? "bg-warning/10 text-warning border-warning/30" :
            "bg-destructive/10 text-destructive border-destructive/30"
          )}
        >
          <TrendingUp className="h-3 w-3" />
          {responseRate}% responded
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Participants ({total})
        </h4>
        {showTrend && (
          <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
            <TrendingUp className="h-3 w-3" />
            {confirmationRate}% confirmed
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(statusConfigs).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <div
              key={status}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-default",
                config.color
              )}
            >
              <Icon className="h-4 w-4" />
              <div>
                <div className="font-medium text-sm">{config.count}</div>
                <div className="text-xs opacity-80">{config.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-500"
                style={{ width: `${responseRate}%` }}
              />
            </div>
            <span className="font-medium">{responseRate}% responded</span>
          </div>
          
          {pending > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-warning">{pending} people</span> still need to respond
            </div>
          )}
        </div>
      )}
    </div>
  );
};
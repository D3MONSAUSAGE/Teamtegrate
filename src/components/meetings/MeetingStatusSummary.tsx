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

  const statusConfigs = {
    accepted: {
      count: confirmed,
      icon: Check,
      label: 'Confirmed',
      color: 'bg-success/10 text-success-foreground border-success/20 hover:bg-success/20'
    },
    tentative: {
      count: tentative,
      icon: UserCheck,
      label: 'Tentative',
      color: 'bg-warning/10 text-warning-foreground border-warning/20 hover:bg-warning/20'
    },
    declined: {
      count: declined,
      icon: X,
      label: 'Declined',
      color: 'bg-destructive/10 text-destructive-foreground border-destructive/20 hover:bg-destructive/20'
    },
    invited: {
      count: pending,
      icon: Clock,
      label: 'Pending',
      color: 'bg-muted/10 text-muted-foreground border-muted/20 hover:bg-muted/20'
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{total}</span>
        </div>
        
        {Object.entries(statusConfigs).map(([status, config]) => {
          if (config.count === 0) return null;
          const Icon = config.icon;
          return (
            <Badge 
              key={status}
              variant="outline" 
              className={cn("text-xs gap-1 transition-colors", config.color)}
            >
              <Icon className="h-3 w-3" />
              {config.count}
            </Badge>
          );
        })}

        {showTrend && confirmationRate > 0 && (
          <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/20">
            <TrendingUp className="h-3 w-3" />
            {confirmationRate}%
          </Badge>
        )}
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${confirmationRate}%` }}
            />
          </div>
          <span>{confirmationRate}% response rate</span>
        </div>
      )}
    </div>
  );
};
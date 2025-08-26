import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { UserPresence } from '@/hooks/useUserPresence';

interface UserPresenceIndicatorProps {
  presence?: UserPresence;
  userId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  position?: 'absolute' | 'relative';
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  presence,
  userId,
  className,
  size = 'md',
  showTooltip = true,
  position = 'absolute'
}) => {
  const isOnline = presence?.isOnline || false;
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const positionClasses = position === 'absolute' 
    ? 'absolute -bottom-0.5 -right-0.5 border-2 border-background'
    : 'relative';

  const getStatusText = () => {
    if (!presence) return 'Unknown status';
    
    if (isOnline) {
      return 'Online now';
    }
    
    if (presence.lastSeenMinutesAgo !== undefined) {
      if (presence.lastSeenMinutesAgo < 1) {
        return 'Last seen just now';
      } else if (presence.lastSeenMinutesAgo < 60) {
        return `Last seen ${presence.lastSeenMinutesAgo} ${presence.lastSeenMinutesAgo === 1 ? 'minute' : 'minutes'} ago`;
      } else if (presence.lastSeenMinutesAgo < 1440) {
        const hours = Math.floor(presence.lastSeenMinutesAgo / 60);
        return `Last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const days = Math.floor(presence.lastSeenMinutesAgo / 1440);
        return `Last seen ${days} ${days === 1 ? 'day' : 'days'} ago`;
      }
    }
    
    return 'Offline';
  };

  const statusDot = (
    <div
      className={cn(
        'rounded-full transition-all duration-200',
        sizeClasses[size],
        positionClasses,
        isOnline 
          ? 'bg-success animate-pulse-ring' 
          : 'bg-muted-foreground',
        className
      )}
    />
  );

  if (!showTooltip) {
    return statusDot;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {statusDot}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-medium">
            {presence?.name || 'Unknown User'}
          </p>
          <p className="text-xs text-muted-foreground">
            {getStatusText()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface UserPresenceListProps {
  presences: UserPresence[];
  className?: string;
  maxVisible?: number;
  compact?: boolean;
}

export const UserPresenceList: React.FC<UserPresenceListProps> = ({
  presences,
  className,
  maxVisible = 5,
  compact = false
}) => {
  const onlineUsers = presences.filter(p => p.isOnline);
  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const extraCount = Math.max(0, onlineUsers.length - maxVisible);

  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {visibleUsers.map((presence) => (
        <div key={presence.user_id} className="relative">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {presence.name.charAt(0).toUpperCase()}
          </div>
          <UserPresenceIndicator
            presence={presence}
            size="sm"
            position="absolute"
          />
        </div>
      ))}
      
      {extraCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
          <span>+{extraCount}</span>
          {!compact && <span>more online</span>}
        </div>
      )}
      
      {!compact && (
        <span className="text-xs text-muted-foreground ml-2">
          {onlineUsers.length === 1 ? '1 user online' : `${onlineUsers.length} users online`}
        </span>
      )}
    </div>
  );
};
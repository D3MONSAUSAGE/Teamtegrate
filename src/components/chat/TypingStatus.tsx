import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Users } from 'lucide-react';

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

interface TypingStatusProps {
  typingUsers: TypingUser[];
  isCurrentUserTyping: boolean;
  compact?: boolean;
}

export const TypingStatus: React.FC<TypingStatusProps> = ({
  typingUsers,
  isCurrentUserTyping,
  compact = false
}) => {
  const hasTypingUsers = typingUsers.length > 0;
  
  if (!hasTypingUsers && !isCurrentUserTyping) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {hasTypingUsers && (
          <Badge variant="secondary" className="text-xs h-5 px-2">
            <Users className="w-3 h-3 mr-1" />
            {typingUsers.length}
          </Badge>
        )}
        {isCurrentUserTyping && (
          <Badge variant="outline" className="text-xs h-5 px-2">
            <Keyboard className="w-3 h-3 mr-1" />
            You
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {hasTypingUsers && (
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>
            {typingUsers.length === 1 
              ? `${typingUsers[0].name} is typing` 
              : `${typingUsers.length} people are typing`
            }
          </span>
        </div>
      )}
      {isCurrentUserTyping && (
        <div className="flex items-center gap-1">
          <Keyboard className="w-3 h-3" />
          <span>You are typing</span>
        </div>
      )}
    </div>
  );
};
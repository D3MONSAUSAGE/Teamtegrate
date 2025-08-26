
import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, TrendingUp, Zap, Sparkles, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useRooms } from '@/hooks/useRooms';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatPageHeaderProps {
  onShowSettings?: () => void;
  activeUsers?: number;
  totalMessages?: number;
}

const ChatPageHeader: React.FC<ChatPageHeaderProps> = ({
  onShowSettings,
  activeUsers = 0,
  totalMessages = 0
}) => {
  const { user } = useAuth();
  const { rooms } = useRooms();
  const isMobile = useIsMobile();

  return (
    <div className="rounded-xl bg-card border border-border/50 mb-6">
      <div className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Chat Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  Team Chat
                </h1>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</span>
                  <div className="hidden sm:block w-px h-3 bg-border" />
                  <span className="text-muted-foreground">Real-time Messaging</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 pt-3">
              <div>
                <div className="text-lg font-semibold text-foreground">{rooms.length}</div>
                <div className="text-xs text-muted-foreground">Active Rooms</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <div className="text-lg font-semibold text-foreground">{activeUsers}</div>
                <div className="text-xs text-muted-foreground">Online Users</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <div className="text-lg font-semibold text-foreground">{totalMessages}</div>
                <div className="text-xs text-muted-foreground">Messages Today</div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex-shrink-0">
            {onShowSettings && (
              <Button 
                onClick={onShowSettings} 
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPageHeader;

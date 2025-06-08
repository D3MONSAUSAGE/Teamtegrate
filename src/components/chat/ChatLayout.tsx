
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatLayoutProps {
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
  fullWidth?: boolean;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ 
  sidebarContent, 
  mainContent,
  fullWidth = false 
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "h-[calc(100vh-4rem)] flex overflow-hidden",
      fullWidth ? "w-full" : "max-w-6xl mx-auto"
    )}>
      {/* Sidebar - always shown on desktop, hidden on mobile when a room is selected */}
      <div className={cn(
        "border-r border-border dark:border-gray-800 bg-background",
        isMobile ? "w-full flex-shrink-0" : "w-80 flex-shrink-0",
        "overflow-hidden"
      )}>
        {sidebarContent}
      </div>

      {/* Main content area - only shown on desktop, or on mobile when a room is selected */}
      <div className="flex-1 overflow-hidden bg-background">
        {mainContent}
      </div>
    </div>
  );
};

export default ChatLayout;

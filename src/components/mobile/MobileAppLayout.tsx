
import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/task';
import { TooltipProvider } from '@/components/ui/tooltip';
import MobileBottomTabBar from './MobileBottomTabBar';
import MobileHeader from './MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileAppLayout = memo(() => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <TooltipProvider>
      <TaskProvider>
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <MobileHeader />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide pb-20">
              <Outlet />
            </div>
          </main>
          
          {/* Bottom Tab Bar */}
          <MobileBottomTabBar />
        </div>
      </TaskProvider>
    </TooltipProvider>
  );
});

MobileAppLayout.displayName = 'MobileAppLayout';

export default MobileAppLayout;

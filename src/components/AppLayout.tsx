
import React, { memo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TaskProvider } from '@/contexts/task';
import { UnifiedDataProvider } from '@/contexts/UnifiedDataContext';
import { TeamProvider } from '@/components/team/TeamProvider';
import { MeetingProvider } from '@/contexts/meeting';
import { useStandalone } from '@/hooks/useStandalone';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';


// Professional main content component with enhanced navigation handling
const MainContent = memo(({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  console.log('🏠 AppLayout MainContent: Rendering with location:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    timestamp: new Date().toLocaleString()
  });

  return (
    <SidebarInset 
      className="flex flex-col flex-1 overflow-hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 lg:px-12 safe-area-bottom" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="space-y-6 py-4 pb-20 md:pb-6">
          {(() => {
            console.log('🎯 AppLayout: About to render children for path:', location.pathname);
            return null;
          })()}
          {children}
        </div>
      </main>
    </SidebarInset>
  );
});

MainContent.displayName = 'MainContent';

// Enhanced loading screen with mobile optimization
const LoadingScreen = memo(() => (
  <div className="min-h-screen-mobile flex items-center justify-center bg-background">
    <div className="text-center p-8">
      <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Loading TeamTegrate</h3>
      <p className="text-muted-foreground">Preparing your workspace...</p>
    </div>
  </div>
));

LoadingScreen.displayName = 'LoadingScreen';

const AppLayout = memo(() => {
  const location = useLocation();
  const isStandalone = useStandalone();

  console.log('🏠 AppLayout: Rendering for path:', location.pathname);

  // Auth check removed - ProtectedRoute wrapper handles authentication
  // Start collapsed on all devices for consistent hover-to-expand UX on desktop
  const defaultSidebarOpen = false;

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <TooltipProvider>
        <UnifiedDataProvider>
          <TaskProvider>
            <TeamProvider>
              <MeetingProvider>
                <div className={`app-full-height bg-background w-full flex overflow-hidden ${isStandalone ? 'standalone-app' : ''}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <Sidebar />
                  <MainContent>
                    {(() => {
                      console.log('🎯 AppLayout: Rendering Outlet for:', location.pathname);
                      return null;
                    })()}
                    <Outlet />
                  </MainContent>
                </div>
              </MeetingProvider>
            </TeamProvider>
          </TaskProvider>
        </UnifiedDataProvider>
      </TooltipProvider>
    </SidebarProvider>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;

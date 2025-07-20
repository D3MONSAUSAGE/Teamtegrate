
import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TaskProvider } from '@/contexts/task';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

// Memoized main content component with mobile optimizations
const MainContent = memo(({ children }: { children: React.ReactNode }) => {
  const { setOpen, isMobile, setOpenMobile } = useSidebar();
  const isDesktop = !isMobile;

  const handleMainContentClick = (e: React.MouseEvent) => {
    // Only close sidebar if we're clicking on the main content area itself
    // and not on any interactive elements
    const target = e.target as HTMLElement;
    const isClickOnMainContent = target === e.currentTarget;
    
    if (isClickOnMainContent) {
      if (isDesktop) {
        setOpen(false);
      } else {
        setOpenMobile(false);
      }
    }
  };

  return (
    <SidebarInset 
      className="flex flex-col flex-1 overflow-hidden no-scrollbar"
      onClick={handleMainContentClick}
    >
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-12 pb-safe-area-inset-bottom no-scrollbar">
        <div className="space-y-4 sm:space-y-6 py-4 pb-16 sm:pb-20 md:pb-6">
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
    <div className="text-center p-6 sm:p-8">
      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-primary/20 rounded-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2">Loading TeamTegrate</h3>
      <p className="text-sm sm:text-base text-muted-foreground">Preparing your workspace...</p>
    </div>
  </div>
));

LoadingScreen.displayName = 'LoadingScreen';

const AppLayout = memo(() => {
  const { user, loading, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ProtectedRoute>
      <TooltipProvider>
        <TaskProvider>
          <SidebarProvider defaultOpen={!isMobile}>
            <div className="min-h-screen-mobile bg-background w-full flex overflow-hidden no-scrollbar">
              <Sidebar />
              <MainContent>
                <Outlet />
              </MainContent>
            </div>
          </SidebarProvider>
        </TaskProvider>
      </TooltipProvider>
    </ProtectedRoute>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;

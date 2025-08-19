
import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TaskProvider } from '@/contexts/task';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';


// Professional main content component with enhanced navigation handling
const MainContent = memo(({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarInset 
      className="flex flex-col flex-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 lg:px-12 safe-area-bottom" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="space-y-6 py-4 pb-20 md:pb-6">
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
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Start collapsed on all devices for consistent hover-to-expand UX on desktop
  const defaultSidebarOpen = false;

  return (
    <ProtectedRoute>
      <TooltipProvider>
        <TaskProvider>
          <SidebarProvider defaultOpen={defaultSidebarOpen}>
            <div className="min-h-screen-mobile bg-background w-full flex" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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


import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

// Memoized main content component
const MainContent = memo(({ children }: { children: React.ReactNode }) => {
  const { setOpen, isMobile, setOpenMobile } = useSidebar();
  const isDesktop = !isMobile;

  const handleMainContentClick = () => {
    if (isDesktop) {
      setOpen(false);
    } else {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarInset 
      className="flex flex-col flex-1 overflow-hidden"
      onClick={handleMainContentClick}
    >
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 lg:px-12">
        <div className="space-y-6 py-4 pb-20 md:pb-6">
          {children}
        </div>
      </main>
    </SidebarInset>
  );
});

MainContent.displayName = 'MainContent';

// Memoized loading component
const LoadingScreen = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
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
  const isMobile = useIsMobile();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen bg-background w-full flex overflow-hidden">
        <Sidebar />
        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </SidebarProvider>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;

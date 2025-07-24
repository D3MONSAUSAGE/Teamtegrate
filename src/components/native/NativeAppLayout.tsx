
import React, { memo, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNativePlatform } from '@/hooks/useNativePlatform';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TaskProvider } from '@/contexts/task';
import NativeDrawer from './NativeDrawer';
import NativeBottomTabs from './NativeBottomTabs';
import NativeHeader from './NativeHeader';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

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

const NativeAppLayout = memo(() => {
  const { user, loading, isAuthenticated } = useAuth();
  const { isNativeAndMobile } = useNativePlatform();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Only render this layout for native mobile platforms
  if (!isNativeAndMobile) {
    return null;
  }

  return (
    <TooltipProvider>
      <TaskProvider>
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
          {/* Native Header */}
          <NativeHeader
            title="TeamTegrate"
            showMenu={true}
            onMenuPress={handleDrawerToggle}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-20">
            <div className="h-full">
              <Outlet />
            </div>
          </main>

          {/* Navigation Drawer */}
          <NativeDrawer
            isOpen={drawerOpen}
            onOpenChange={setDrawerOpen}
          />

          {/* Bottom Tab Navigation */}
          <NativeBottomTabs />
        </div>
      </TaskProvider>
    </TooltipProvider>
  );
});

NativeAppLayout.displayName = 'NativeAppLayout';

export default NativeAppLayout;

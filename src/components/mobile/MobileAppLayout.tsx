/**
 * Mobile App Layout Component
 * Complete mobile-native layout with bottom navigation and safe areas
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import NativeLayout from './NativeLayout';
import NativeNavigation from './NativeNavigation';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';

const MobileAppLayout: React.FC = () => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // Use regular desktop layout
    return <Outlet />;
  }

  return (
    <NativeLayout
      useSafeArea={true}
      nativeScrolling={true}
      preventHorizontalScroll={true}
      statusBarStyle="auto"
    >
      {/* Mobile Header */}
      <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Navbar />
      </div>

      {/* Main Content Area */}
      <main 
        className={cn(
          'flex-1 overflow-hidden',
          'pb-[80px]', // Space for bottom navigation
          'native-scroll'
        )}
      >
        <div className="h-full overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <NativeNavigation />
    </NativeLayout>
  );
};

export default MobileAppLayout;
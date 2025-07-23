
import React from 'react';
import { Capacitor } from '@capacitor/core';
import MobileBottomTabBar from './MobileBottomTabBar';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, className }) => {
  const isMobile = Capacitor.isNativePlatform() || window.innerWidth < 768;

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className={cn("pb-20", className)}>
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <MobileBottomTabBar />
    </div>
  );
};

export default MobileLayout;

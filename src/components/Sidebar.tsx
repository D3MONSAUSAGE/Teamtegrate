
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAutoSidebar } from '@/hooks/useAutoSidebar';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNav from './sidebar/SidebarNav';
import SidebarFooter from './sidebar/SidebarFooter';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader as ShadcnSidebarHeader,
  SidebarFooter as ShadcnSidebarFooter,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNavigation?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigation }) => {
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const {
    isExpanded,
    isMobileOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleMobileToggle,
    handleBackdropClick,
    isMobile
  } = useAutoSidebar();

  if (!user) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleBackdropClick}
        />
      )}
      
      {/* Hover area for desktop - extends beyond collapsed sidebar */}
      {!isMobile && (
        <div
          className="fixed left-0 top-0 h-full w-16 z-30 hidden md:block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
      
      {/* Mobile edge trigger */}
      {isMobile && !isMobileOpen && (
        <div
          className="fixed left-0 top-0 h-full w-4 z-30 md:hidden"
          onTouchStart={handleMobileToggle}
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out",
          isMobile ? (isMobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          !isMobile && !isExpanded && "-translate-x-44" // Show only 3rem (48px) when collapsed
        )}
        onMouseEnter={!isMobile ? handleMouseEnter : undefined}
        onMouseLeave={!isMobile ? handleMouseLeave : undefined}
      >
        <ShadcnSidebar 
          className={cn(
            "border-r border-border w-64 transition-all duration-300",
            !isMobile && !isExpanded && "w-12"
          )}
        >
          <ShadcnSidebarHeader>
            <SidebarHeader 
              isDark={isDark} 
              onToggleDarkMode={toggle} 
              onNavigation={onNavigation}
              isCollapsed={!isMobile && !isExpanded}
            />
          </ShadcnSidebarHeader>
          
          <SidebarContent>
            <SidebarNav 
              onNavigation={onNavigation} 
              isCollapsed={!isMobile && !isExpanded}
            />
          </SidebarContent>
          
          <ShadcnSidebarFooter>
            <SidebarFooter 
              user={user} 
              isCollapsed={!isMobile && !isExpanded}
            />
          </ShadcnSidebarFooter>
        </ShadcnSidebar>
      </div>
    </>
  );
};

export default Sidebar;

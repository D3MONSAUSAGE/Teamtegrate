
import React, { memo, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNav from './sidebar/SidebarNav';
import SidebarFooter from './sidebar/SidebarFooter';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader as ShadcnSidebarHeader,
  SidebarFooter as ShadcnSidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

interface SidebarProps {
  onNavigation?: () => void;
}

const Sidebar: React.FC<SidebarProps> = memo(({ onNavigation }) => {
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const { state, isMobile, setOpenMobile, open, isHoverExpanded } = useSidebar();

  // Memoize user object to prevent unnecessary re-renders
  const sidebarUser = useMemo(() => {
    if (!user) return null;
    
    return {
      name: user.name || user.email || 'User',
      email: user.email,
      role: user.role
    };
  }, [user?.name, user?.email, user?.role]);

  // Mobile-optimized navigation handler
  const handleNavigation = useCallback(() => {
    // Close sidebar when navigating on mobile
    if (isMobile) {
      setOpenMobile(false);
    }
    onNavigation?.();
  }, [isMobile, setOpenMobile, onNavigation]);

  if (!sidebarUser) {
    return null;
  }

  // Sidebar is collapsed if it's not mobile and neither manually open nor hover expanded
  const isCollapsed = !isMobile && !open && !isHoverExpanded;

  return (
    <ShadcnSidebar 
      className="border-r border-sidebar-border/60 transition-all duration-300 bg-sidebar-background"
      collapsible={isMobile ? "offcanvas" : "icon"}
      variant="sidebar"
    >
      <ShadcnSidebarHeader className="border-b border-sidebar-border/30">
        <SidebarHeader 
          isDark={isDark} 
          onToggleDarkMode={toggle} 
          onNavigation={handleNavigation}
          isCollapsed={isCollapsed}
        />
      </ShadcnSidebarHeader>
      
      <SidebarContent className="overflow-y-auto overflow-x-hidden">
        <div className="p-2">
          <SidebarNav 
            onNavigation={handleNavigation} 
            isCollapsed={isCollapsed}
          />
        </div>
      </SidebarContent>
      
      <ShadcnSidebarFooter className="border-t border-sidebar-border/30 bg-gradient-to-t from-sidebar-background/80 to-transparent">
        <SidebarFooter 
          user={sidebarUser} 
          isCollapsed={isCollapsed}
        />
      </ShadcnSidebarFooter>
    </ShadcnSidebar>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

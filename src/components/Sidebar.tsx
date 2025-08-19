import React, { memo, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNav from './sidebar/SidebarNav';
import SidebarFooter from './sidebar/SidebarFooter';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const { state, isMobile, isTablet, isDesktop, setOpenMobile, setOpen, open, isHovering, setIsHovering } = useSidebar();

  // Memoize user object to prevent unnecessary re-renders
  const sidebarUser = useMemo(() => {
    if (!user) return null;
    
    return {
      name: user.name || user.email || 'User',
      email: user.email,
      role: user.role
    };
  }, [user?.name, user?.email, user?.role]);

  // Professional navigation handler with breakpoint-aware behavior
  const handleNavigation = useCallback(() => {
    if (isMobile) {
      // Mobile: Close overlay drawer
      setOpenMobile(false);
    } else if (isTablet) {
      // Tablet: Retract for better UX
      setOpen(false);
    }
    // Desktop: Keep expanded
    
    onNavigation?.();
  }, [isMobile, isTablet, setOpenMobile, setOpen, onNavigation]);

  // Handle hover events for desktop using context
  const handleMouseEnter = useCallback(() => {
    if (isDesktop && !open) {
      setIsHovering(true);
    }
  }, [isDesktop, open, setIsHovering]);

  const handleMouseLeave = useCallback(() => {
    if (isDesktop && !open) {
      setIsHovering(false);
    }
  }, [isDesktop, open, setIsHovering]);

  if (!sidebarUser) {
    return null;
  }

  // Professional collapsed state calculation with hover consideration
  const isCollapsed = !isMobile && !open && !isHovering;
  const shouldShowExpanded = isMobile || open || (isDesktop && isHovering);

  return (
    <ShadcnSidebar 
      className="border-r border-sidebar-border/60 transition-all duration-300 bg-sidebar-background"
      collapsible="icon"
      variant="sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ShadcnSidebarHeader className="border-b border-sidebar-border/30">
        <SidebarHeader 
          isDark={isDark} 
          onToggleDarkMode={toggle} 
          onNavigation={handleNavigation}
          isCollapsed={isCollapsed}
        />
      </ShadcnSidebarHeader>
      
      <SidebarContent>
        <ScrollArea className="flex-1">
          <div className="p-2">
            <SidebarNav 
              onNavigation={handleNavigation} 
              isCollapsed={isCollapsed}
            />
          </div>
        </ScrollArea>
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

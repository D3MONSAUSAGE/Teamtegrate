
import React, { memo, useMemo } from 'react';
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
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();

  // Memoize user object to prevent unnecessary re-renders
  const sidebarUser = useMemo(() => {
    if (!user) return null;
    
    return {
      name: user.name || user.email || 'User',
      email: user.email,
      role: user.role
    };
  }, [user?.name, user?.email, user?.role]);

  // Memoize handlers
  const handleNavigation = useMemo(() => () => {
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
    onNavigation?.();
  }, [isMobile, setOpenMobile, onNavigation]);

  const handleMouseEnter = useMemo(() => () => {
    // Only expand on hover for desktop
    if (!isMobile) {
      setOpen(true);
    }
  }, [isMobile, setOpen]);

  const handleMouseLeave = useMemo(() => () => {
    // Only collapse on hover leave for desktop
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);

  if (!sidebarUser) return null;

  const isCollapsed = !isMobile && state === 'collapsed';

  return (
    <ShadcnSidebar 
      className="glass-sidebar border-r border-sidebar-border/60 backdrop-blur-xl no-scrollbar overflow-hidden transition-all duration-300"
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
      
      <SidebarContent className="no-scrollbar overflow-y-auto">
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

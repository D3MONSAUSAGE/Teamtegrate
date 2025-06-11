
import React from 'react';
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

const Sidebar: React.FC<SidebarProps> = ({ onNavigation }) => {
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();

  const handleNavigation = () => {
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
    onNavigation?.();
  };

  const handleMouseEnter = () => {
    // Only expand on hover for desktop
    if (!isMobile) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    // Only collapse on hover leave for desktop
    if (!isMobile) {
      setOpen(false);
    }
  };

  if (!user) return null;

  const isCollapsed = !isMobile && state === 'collapsed';

  // Create a safe user object for the sidebar footer
  const sidebarUser = {
    name: user.name || user.email || 'User',
    email: user.email,
    role: user.role
  };

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
};

export default Sidebar;

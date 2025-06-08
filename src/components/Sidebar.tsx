
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
  const { state, isMobile, setOpenMobile } = useSidebar();

  const handleNavigation = () => {
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
    onNavigation?.();
  };

  if (!user) return null;

  const isCollapsed = !isMobile && state === 'collapsed';

  return (
    <ShadcnSidebar 
      className="border-r border-border"
      collapsible="icon"
    >
      <ShadcnSidebarHeader>
        <SidebarHeader 
          isDark={isDark} 
          onToggleDarkMode={toggle} 
          onNavigation={handleNavigation}
          isCollapsed={isCollapsed}
        />
      </ShadcnSidebarHeader>
      
      <SidebarContent>
        <SidebarNav 
          onNavigation={handleNavigation} 
          isCollapsed={isCollapsed}
        />
      </SidebarContent>
      
      <ShadcnSidebarFooter>
        <SidebarFooter 
          user={user} 
          isCollapsed={isCollapsed}
        />
      </ShadcnSidebarFooter>
    </ShadcnSidebar>
  );
};

export default Sidebar;

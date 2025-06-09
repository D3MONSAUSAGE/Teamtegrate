
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
  useSidebar,
} from '@/components/ui/sidebar';

interface SidebarProps {
  onNavigation?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigation }) => {
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const { state, isMobile, setOpenMobile } = useSidebar();
  
  // Use auto-sidebar for desktop hover behavior
  const {
    isExpanded,
    handleMouseEnter,
    handleMouseLeave,
    handleMobileToggle,
    handleBackdropClick
  } = useAutoSidebar();

  const handleNavigation = () => {
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
    onNavigation?.();
  };

  if (!user) return null;

  // For mobile, use the original shadcn behavior
  // For desktop, use auto-collapse behavior
  const isCollapsed = isMobile ? (state === 'collapsed') : !isExpanded;

  return (
    <ShadcnSidebar 
      className="border-r border-sidebar-border transition-all duration-300"
      collapsible="icon"
      variant="sidebar"
      onMouseEnter={!isMobile ? handleMouseEnter : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
    >
      <ShadcnSidebarHeader className="border-b border-sidebar-border">
        <SidebarHeader 
          isDark={isDark} 
          onToggleDarkMode={toggle} 
          onNavigation={handleNavigation}
          isCollapsed={isCollapsed}
        />
      </ShadcnSidebarHeader>
      
      <SidebarContent className="overflow-y-auto">
        <div className="p-2">
          <SidebarNav 
            onNavigation={handleNavigation} 
            isCollapsed={isCollapsed}
          />
        </div>
      </SidebarContent>
      
      <ShadcnSidebarFooter className="border-t border-sidebar-border">
        <SidebarFooter 
          user={user} 
          isCollapsed={isCollapsed}
        />
      </ShadcnSidebarFooter>
    </ShadcnSidebar>
  );
};

export default Sidebar;

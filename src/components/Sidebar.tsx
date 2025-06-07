
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
} from '@/components/ui/sidebar';

interface SidebarProps {
  onNavigation?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigation }) => {
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();

  if (!user) return null;

  return (
    <ShadcnSidebar 
      collapsible="icon"
      className="border-r border-border"
    >
      <ShadcnSidebarHeader>
        <SidebarHeader 
          isDark={isDark} 
          onToggleDarkMode={toggle} 
          onNavigation={onNavigation} 
        />
      </ShadcnSidebarHeader>
      
      <SidebarContent>
        <SidebarNav onNavigation={onNavigation} />
      </SidebarContent>
      
      <ShadcnSidebarFooter>
        <SidebarFooter user={user} />
      </ShadcnSidebarFooter>
    </ShadcnSidebar>
  );
};

export default Sidebar;

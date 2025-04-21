import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNav from './sidebar/SidebarNav';
import SidebarFooter from './sidebar/SidebarFooter';

interface SidebarProps {
  onNavigation?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigation }) => {
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();

  if (!user) return null;

  return (
    <aside
      className="flex flex-col h-full w-64 z-30 bg-background text-foreground border-r border-border fixed top-0 left-0 transition-colors duration-300"
      style={{
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
      }}
      aria-label="Sidebar"
    >
      <SidebarHeader isDark={isDark} onToggleDarkMode={toggle} />

      <SidebarNav onNavigation={onNavigation} />

      <SidebarFooter user={user} />
    </aside>
  );
};

export default Sidebar;

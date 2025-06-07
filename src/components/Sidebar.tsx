
import React from 'react';
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
      {/* Main sidebar content */}
      <div className="flex flex-col flex-1 min-h-0">
        <SidebarHeader isDark={isDark} onToggleDarkMode={toggle} onNavigation={onNavigation} />
        {/* Nav wraps & grows */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <SidebarNav onNavigation={onNavigation} />
        </div>
      </div>
      {/* Footer sticks to bottom */}
      <SidebarFooter user={user} />
    </aside>
  );
};

export default Sidebar;

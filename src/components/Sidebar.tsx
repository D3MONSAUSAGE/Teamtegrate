
import React, { memo, useMemo, useEffect, useCallback } from 'react';
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
  const { state, isMobile, setOpenMobile, setOpen, open } = useSidebar();

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
    // Always close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
    onNavigation?.();
  }, [isMobile, setOpenMobile, onNavigation]);

  // Desktop hover behavior
  const handleMouseEnter = useMemo(() => () => {
    if (!isMobile) {
      setOpen(true);
    }
  }, [isMobile, setOpen]);

  const handleMouseLeave = useMemo(() => () => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);

  // Handle overlay click on mobile
  const handleOverlayClick = useCallback(() => {
    if (isMobile && open) {
      setOpenMobile(false);
    }
  }, [isMobile, open, setOpenMobile]);

  if (!sidebarUser) return null;

  const isCollapsed = !isMobile && state === 'collapsed';

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={handleOverlayClick}
          style={{ zIndex: 40 }}
        />
      )}
      
      <ShadcnSidebar 
        className={`
          border-r border-sidebar-border/60 transition-all duration-300
          ${isMobile ? 'fixed left-0 top-0 z-50 h-full shadow-2xl bg-sidebar-background' : 'bg-sidebar-background'}
          ${isMobile && !open ? '-translate-x-full' : 'translate-x-0'}
        `}
        collapsible={isMobile ? "offcanvas" : "icon"}
        variant="sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ 
          width: isMobile ? '280px' : undefined,
          zIndex: isMobile ? 50 : undefined,
          overflow: 'hidden'
        }}
      >
        <ShadcnSidebarHeader className={`
          border-b border-sidebar-border/30
          ${isMobile ? 'mobile-safe-area px-6 py-4' : ''}
        `}>
          <SidebarHeader 
            isDark={isDark} 
            onToggleDarkMode={toggle} 
            onNavigation={handleNavigation}
            isCollapsed={isCollapsed}
          />
        </ShadcnSidebarHeader>
        
        <SidebarContent className={`
          overflow-y-auto overflow-x-hidden
          ${isMobile ? 'px-4 py-2' : ''}
        `} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className={isMobile ? 'py-2' : 'p-2'}>
            <SidebarNav 
              onNavigation={handleNavigation} 
              isCollapsed={isCollapsed}
            />
          </div>
        </SidebarContent>
        
        <ShadcnSidebarFooter className={`
          border-t border-sidebar-border/30 bg-gradient-to-t from-sidebar-background/80 to-transparent
          ${isMobile ? 'mobile-safe-area' : ''}
        `}>
          <SidebarFooter 
            user={sidebarUser} 
            isCollapsed={isCollapsed}
          />
        </ShadcnSidebarFooter>
      </ShadcnSidebar>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

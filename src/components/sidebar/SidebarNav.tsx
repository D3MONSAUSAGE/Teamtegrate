
import React, { memo, useMemo, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Home,
  CheckSquare,  
  Briefcase,
  Users,
  Calendar,
  CalendarCheck,
  Target,
  BarChart3,
  MessageCircle,
  FileText,
  DollarSign,
  NotebookPen,
  User,
  Clock,
} from 'lucide-react';

interface NavItemProps {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface SidebarNavProps {
  onNavigation?: () => void;
  isCollapsed?: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = memo(({ onNavigation, isCollapsed = false }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Memoize navigation items to prevent re-creation on every render
  const navigation = useMemo(() => [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
    { name: 'Organization', href: '/dashboard/organization', icon: Users },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Meetings', href: '/dashboard/meetings', icon: CalendarCheck },
    { name: 'Focus', href: '/dashboard/focus', icon: Target },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageCircle },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
    { name: 'Notebook', href: '/dashboard/notebook', icon: NotebookPen },
    { name: 'Time Clock', href: '/dashboard/time-tracking', icon: Clock },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ], []);

  // Enhanced active route detection that handles nested routes
  const isActiveRoute = useCallback((itemHref: string, currentPath: string) => {
    // Exact match for dashboard root
    if (itemHref === '/dashboard' && currentPath === '/dashboard') {
      return true;
    }
    
    // For other routes, check if current path starts with the item href
    // This handles nested routes like /dashboard/projects/123
    if (itemHref !== '/dashboard' && currentPath.startsWith(itemHref)) {
      return true;
    }
    
    return false;
  }, []);

  // Memoize the navigation click handler
  const handleNavClick = useCallback(() => {
    if (onNavigation) {
      onNavigation();
    }
  }, [onNavigation]);

  // Memoize the current path for comparison
  const currentPath = useMemo(() => location.pathname, [location.pathname]);

  if (!user) return null;

  return (
    <div className="flex flex-col space-y-1 p-2">
      {navigation.map((item: NavItemProps) => {
        const isActive = isActiveRoute(item.href, currentPath);
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={(e) => {
              console.log('🖱️ SIDEBAR CLICK:', {
                itemName: item.name,
                href: item.href,
                currentPath: location.pathname,
                isActive,
                timestamp: new Date().toISOString()
              });
              if (onNavigation) {
                console.log('🔄 Calling onNavigation callback');
                onNavigation();
              }
            }}
            className={cn(
              "group relative flex items-center rounded-lg p-3 text-sm font-medium transition-all duration-300 overflow-hidden",
              "hover:scale-[1.02] hover:shadow-md",
              isActive
                ? "bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10 text-primary border-l-4 border-primary shadow-sm"
                : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:via-transparent hover:to-accent/5 hover:text-foreground hover:shadow-sm",
              isCollapsed ? "justify-center px-2" : "space-x-3"
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Background gradient overlay for hover effect */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none",
              isActive && "opacity-50"
            )} />
            
            {/* Icon container with modern styling */}
            <div className={cn(
              "relative p-2 rounded-full transition-all duration-300 flex-shrink-0",
              isActive 
                ? "bg-gradient-to-r from-primary/20 to-accent/20 shadow-sm" 
                : "group-hover:bg-gradient-to-r group-hover:from-primary/10 group-hover:to-accent/10"
            )}>
              <item.icon className={cn(
                "h-4 w-4 transition-all duration-300",
                isActive ? "text-primary scale-110" : "group-hover:scale-110"
              )} />
            </div>
            
            {/* Text with gradient effect when active */}
            {!isCollapsed && (
              <span className={cn(
                "truncate font-medium transition-all duration-300",
                isActive && "bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-semibold"
              )}>
                {item.name}
              </span>
            )}
            
            {/* Active indicator dot for collapsed state */}
            {isCollapsed && isActive && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-sm animate-pulse" />
            )}
            
            {/* Subtle glow effect for active items */}
            {isActive && (
              <div className="absolute inset-0 rounded-lg bg-primary/5 animate-pulse" />
            )}
          </Link>
        );
      })}
    </div>
  );
});

SidebarNav.displayName = 'SidebarNav';

export default SidebarNav;

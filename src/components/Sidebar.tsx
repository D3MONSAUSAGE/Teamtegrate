import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban,  
  Users, 
  Settings,
  BarChart3,
  Timer,
  Clock,
  FileText,
  DollarSign,
  MessageSquare,
  Sun,
  Moon,
  ListChecks
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface SidebarProps {
  onNavigation?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigation }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Projects',
      path: '/dashboard/projects',
      icon: <FolderKanban className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'My Tasks',
      path: '/dashboard/tasks',
      icon: <CheckSquare className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Checklists',
      path: '/dashboard/checklists',
      icon: <ListChecks className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Time Tracking',
      path: '/dashboard/time-tracking',
      icon: <Timer className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Timeline',
      path: '/dashboard/timeline',
      icon: <Clock className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Team',
      path: '/dashboard/team',
      icon: <Users className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Reports',
      path: '/dashboard/reports',
      icon: <BarChart3 className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Finance',
      path: '/dashboard/finance',
      icon: <DollarSign className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Documents',
      path: '/dashboard/documents',
      icon: <FileText className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Team Chat',
      path: '/dashboard/chat',
      icon: <MessageSquare className="h-5 w-5" />,
      allowed: true,
    },
    {
      name: 'Settings',
      path: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" />,
      allowed: true,
    },
  ];

  if (!user) return null;

  const handleNavClick = () => {
    if (onNavigation) onNavigation();
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-64 z-30 bg-background text-foreground border-r border-border",
        "fixed top-0 left-0",
        "transition-colors duration-300"
      )}
      style={{
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
      }}
      aria-label="Sidebar"
    >
      <div className="p-6 pt-5 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-primary">
            TeamStream
          </h2>
          <p className="text-sm text-muted-foreground">Manage your tasks & projects</p>
        </div>
        <button
          aria-label="Toggle dark mode"
          className={cn(
            "rounded-full p-1.5 hover:bg-muted border border-transparent hover:border-primary transition-colors duration-200",
            "focus:outline-none"
          )}
          onClick={toggle}
          style={{
            minWidth: "34px",
            minHeight: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDark ? <Moon className="h-5 w-5 text-yellow-300" /> : <Sun className="h-5 w-5 text-yellow-400" />}
        </button>
      </div>

      <div className="flex-1 px-4 overflow-visible">
        <ul className="space-y-2">
          {navItems.map((item) => {
            if (!item.allowed) return null;

            const isActiveItem = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none",
                    isActiveItem
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background text-foreground hover:bg-muted hover:text-primary focus:ring-2 focus:ring-primary"
                  )}
                  style={{
                    letterSpacing: '0.02em'
                  }}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center",
                      isActiveItem
                        ? "text-primary-foreground"
                        : "text-primary group-hover:text-primary group-focus:text-primary"
                    )}
                  >
                    {React.cloneElement(item.icon as JSX.Element, {
                      className: cn(
                        "w-6 h-6",
                        isActiveItem
                          ? "stroke-[2.2] text-primary-foreground"
                          : "stroke-[2.2] text-primary"
                      ),
                    })}
                  </span>
                  <span
                    className={cn(
                      "ml-2",
                      isActiveItem ? "text-primary-foreground font-bold" : "text-foreground font-semibold"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-border bg-background">
        <div className="text-xs text-muted-foreground">
          <p>Logged in as</p>
          <p className="font-semibold text-primary">{user.name}</p>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="mt-1 font-medium text-primary">{user.role === 'manager' ? 'Manager' : 'Team Member'}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

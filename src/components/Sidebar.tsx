
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
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  onNavigation?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigation }) => {
  const location = useLocation();
  const { user } = useAuth();
  
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
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h2 className="text-lg font-bold tracking-wide text-primary/90">TeamStream</h2>
        <p className="text-sm text-gray-600">Manage your tasks & projects</p>
      </div>
      
      <div className="flex-1 px-4">
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
                      ? "bg-primary/90 text-white shadow-md"
                      : "bg-white text-black hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary/60"
                  )}
                  style={{
                    letterSpacing: '0.02em'
                  }}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center",
                      isActiveItem
                        ? "text-white"
                        : "text-primary/70 group-hover:text-primary group-focus:text-primary"
                    )}
                  >
                    {React.cloneElement(item.icon as JSX.Element, {
                      className: cn(
                        "w-6 h-6",
                        isActiveItem
                          ? "stroke-[2.2] text-white"
                          : "stroke-[2.2] text-primary/80 group-hover:text-primary"
                      ),
                    })}
                  </span>
                  <span
                    className={cn(
                      "ml-2",
                      isActiveItem ? "text-white font-bold" : "text-black font-semibold" // changed to black text here
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
      
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Logged in as</p>
          <p className="font-semibold">{user.name}</p>
          <p>{user.email}</p>
          <p className="mt-1 font-medium">{user.role === 'manager' ? 'Manager' : 'Team Member'}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


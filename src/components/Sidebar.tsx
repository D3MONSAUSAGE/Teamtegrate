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
  Calendar,
  Timer
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
      name: 'Calendar',
      path: '/dashboard/calendar',
      icon: <Calendar className="h-5 w-5" />,
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
        <h2 className="text-lg font-bold">TeamStream</h2>
        <p className="text-sm text-gray-600">Manage your tasks & projects</p>
      </div>
      
      <div className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            if (!item.allowed) return null;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive(item.path)
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  {item.name}
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

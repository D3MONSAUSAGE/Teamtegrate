
import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Calendar,
  MessageSquare,
  Users,
  BarChart3,
  Clock,
  DollarSign,
  FileText,
  CalendarDays,
  Book,
  NotebookPen,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  icon: React.FC;
  label: string;
  path: string;
}

interface SidebarProps {
  onNavigation?: () => void;
}

export const Sidebar = ({ onNavigation }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: FolderOpen, label: 'Projects', path: '/projects' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Users, label: 'Team', path: '/team' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Clock, label: 'Time Tracking', path: '/time-tracking' },
    { icon: DollarSign, label: 'Finance', path: '/finance' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: CalendarDays, label: 'Timeline', path: '/timeline' },
    { icon: Book, label: 'Journal', path: '/journal' },
    { icon: NotebookPen, label: 'Notebook', path: '/notebook' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gray-100 border-r shadow-sm',
        isCollapsed ? 'w-16' : 'w-60',
        'transition-all duration-300 ease-in-out'
      )}
    >
      <div className="flex items-center justify-between p-4">
        <span className={cn('text-2xl font-semibold', isCollapsed ? 'hidden' : '')}>
          Taskify
        </span>
        <Button onClick={toggleSidebar} variant="ghost" size="sm">
          {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
        </Button>
      </div>
      <div className="flex-grow p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.label}>
              <Link
                to={item.path}
                className={cn(
                  'flex items-center p-2 rounded-md hover:bg-gray-200',
                  location.pathname === item.path
                    ? 'bg-gray-200 font-semibold'
                    : 'font-medium'
                )}
                onClick={onNavigation}
              >
                <item.icon className="h-5 w-5 mr-2" />
                <span className={cn(isCollapsed ? 'hidden' : '')}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;

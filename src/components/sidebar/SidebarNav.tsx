
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderOpen, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Clock,
  FileText,
  DollarSign,
  NotebookPen,
  Calendar,
  Bell,
  User,
  Target
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useNotifications } from '@/hooks/use-notifications';

interface SidebarNavProps {
  onNavigation: () => void;
  isCollapsed: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ onNavigation, isCollapsed }) => {
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { isMobile } = useSidebar();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Team', href: '/dashboard/team', icon: Users },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { 
      name: 'Notifications', 
      href: '/dashboard/notifications', 
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Time Tracking', href: '/dashboard/time-tracking', icon: Clock },
    { name: 'Focus Zone', href: '/dashboard/focus-zone', icon: Target },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
    { name: 'Notebook', href: '/dashboard/notebook', icon: NotebookPen },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <SidebarMenu>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.name}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sidebar-foreground rounded-lg transition-colors",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Link 
                to={item.href} 
                onClick={onNavigation}
                className="flex items-center gap-3 w-full"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="bg-sidebar-primary text-sidebar-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};

export default SidebarNav;

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Home,
  CheckSquare,
  Briefcase,
  Users,
  Calendar,
  Target,
  BarChart3,
  MessageCircle,
  FileText,
  DollarSign,
  BookOpen,
  NotebookPen,
} from 'lucide-react';

interface NavItemProps {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const SidebarNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
    { name: 'Organization', href: '/dashboard/organization', icon: Users },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Focus', href: '/dashboard/focus', icon: Target },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageCircle },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
    { name: 'Journal', href: '/dashboard/journal', icon: BookOpen },
    { name: 'Notebook', href: '/dashboard/notebook', icon: NotebookPen },
  ];

  return (
    <div className="flex flex-col space-y-1">
      {navigation.map((item: NavItemProps) => (
        <Link
          key={item.name}
          to={item.href}
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 text-sm font-medium hover:bg-secondary hover:text-accent-foreground",
            location.pathname === item.href
              ? "bg-secondary text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default SidebarNav;

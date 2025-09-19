import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar, 
  Focus, 
  BarChart3, 
  Folder, 
  Users, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompactQuickActionsProps {
  userRole: string;
}

const CompactQuickActions: React.FC<CompactQuickActionsProps> = ({ userRole }) => {
  const quickActions = [
    {
      label: 'New Task',
      icon: Plus,
      action: () => {
        // This will be handled by parent component
        const event = new CustomEvent('create-task');
        window.dispatchEvent(event);
      },
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      variant: 'default' as const
    },
    {
      label: 'Calendar',
      icon: Calendar,
      href: '/dashboard/calendar',
      color: 'text-green-600 bg-green-50 dark:bg-green-950/20'
    },
    {
      label: 'Focus Mode',
      icon: Focus,
      href: '/dashboard/focus',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20'
    },
    {
      label: 'Reports',
      icon: BarChart3,
      href: '/dashboard/reports',
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20'
    }
  ];

  // Add role-specific actions
  if (userRole === 'manager') {
    quickActions.push(
      {
        label: 'Projects',
        icon: Folder,
        href: '/dashboard/projects',
        color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20'
      },
      {
        label: 'Team',
        icon: Users,
        href: '/dashboard/organization',
        color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/20'
      }
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            
            if (action.href) {
              return (
                <Link key={index} to={action.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full h-auto p-3 flex flex-col gap-2 hover:shadow-sm transition-all ${action.color || ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                </Link>
              );
            }

            return (
              <Button
                key={index}
                variant={action.variant || "ghost"}
                size="sm"
                onClick={action.action}
                className={`w-full h-auto p-3 flex flex-col gap-2 hover:shadow-sm transition-all ${action.color || ''}`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactQuickActions;
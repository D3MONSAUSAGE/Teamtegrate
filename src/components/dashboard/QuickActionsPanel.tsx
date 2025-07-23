
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  Clock,
  Zap,
  Target,
  Briefcase,
  Smartphone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface QuickActionsPanelProps {
  onCreateTask: () => void;
  userRole: string;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onCreateTask,
  userRole
}) => {
  const handleDownloadApp = () => {
    try {
      // Open download link in new tab
      window.open('https://github.com/D3MONSAUSAGE/Teamtegrate/releases/download/v1.0.0/app-release.apk', '_blank');
      
      // Show success toast
      toast({
        title: "Download Started",
        description: "The TeamTegrate Android app is being downloaded.",
      });
    } catch (error) {
      // Show error toast
      toast({
        title: "Download Failed", 
        description: "Unable to download the app. Please try again.",
        variant: "destructive",
      });
    }
  };

  const quickActions = [
    {
      label: 'New Task',
      icon: Plus,
      action: onCreateTask,
      color: 'from-primary to-blue-600',
      shortcut: 'Ctrl+N'
    },
    {
      label: 'Calendar',
      icon: Calendar,
      href: '/dashboard/calendar',
      color: 'from-emerald-500 to-green-600',
      shortcut: 'Ctrl+C'
    },
    {
      label: 'Focus Mode',
      icon: Target,
      href: '/dashboard/focus',
      color: 'from-purple-500 to-violet-600',
      shortcut: 'Ctrl+F'
    },
    {
      label: 'Reports',
      icon: FileText,
      href: '/dashboard/reports',
      color: 'from-orange-500 to-red-600',
      shortcut: 'Ctrl+R'
    }
  ];

  // Add manager-specific actions
  if (userRole === 'manager') {
    quickActions.push(
      {
        label: 'Projects',
        icon: Briefcase,
        href: '/dashboard/projects',
        color: 'from-cyan-500 to-blue-600',
        shortcut: 'Ctrl+P'
      },
      {
        label: 'Team',
        icon: Users,
        href: '/dashboard/organization',
        color: 'from-indigo-500 to-purple-600',
        shortcut: 'Ctrl+T'
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        <Badge variant="secondary" className="text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Fast Access
        </Badge>
      </div>
      
      {/* Android App Download Button */}
      <div className="mb-6">
        <Button
          onClick={handleDownloadApp}
          className="w-full h-16 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
        >
          <Smartphone className="h-6 w-6 mr-3" />
          📲 Download Android App
        </Button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action, index) => (
          <div key={action.label} className="group">
            {action.href ? (
              <Link to={action.href}>
                <Button
                  variant="outline"
                  className={`w-full h-auto p-4 flex flex-col items-center gap-3 border-2 border-transparent hover:border-primary/20 bg-gradient-to-br ${action.color} text-white hover:shadow-lg transition-all duration-300 hover:scale-105`}
                >
                  <action.icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={action.action}
                className={`w-full h-auto p-4 flex flex-col items-center gap-3 border-2 border-transparent hover:border-primary/20 bg-gradient-to-br ${action.color} text-white hover:shadow-lg transition-all duration-300 hover:scale-105`}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            )}
            
            {/* Keyboard shortcut hint */}
            <div className="text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {action.shortcut}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsPanel;

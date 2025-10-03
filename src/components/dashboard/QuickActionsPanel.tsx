
import React, { useState } from 'react';
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
  Smartphone,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import BugReportDialog from '@/components/support/BugReportDialog';

interface QuickActionsPanelProps {
  userRole: string;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  userRole
}) => {
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
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
    },
    {
      label: 'Report Bug',
      icon: MessageCircle,
      action: () => setIsBugReportOpen(true),
      color: 'from-red-500 to-orange-600',
      shortcut: 'Ctrl+B'
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
    <div className="space-y-4">
      {/* Download Android App Button */}
      <div className="relative">
        <Button
          onClick={handleDownloadApp}
          variant="default"
          size="lg"
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <Smartphone className="h-5 w-5 mr-2" />
          📲 Download Android App
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action, index) => (
          <div key={action.label}>
            {action.href ? (
              <Link to={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-1.5 hover:bg-accent/50 transition-colors duration-200 bg-card"
                >
                  <action.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={action.action}
                className="w-full h-20 flex flex-col items-center justify-center gap-1.5 hover:bg-accent/50 transition-colors duration-200 bg-card"
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      <BugReportDialog 
        open={isBugReportOpen} 
        onOpenChange={setIsBugReportOpen} 
      />
    </div>
  );
};

export default QuickActionsPanel;

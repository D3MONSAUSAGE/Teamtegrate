
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FileText, Calendar, MessageSquare, Users, TrendingUp, Settings, Download, Share } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";

const ProfessionalQuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      title: "View Reports",
      description: "Performance & analytics",
      icon: TrendingUp,
      onClick: () => navigate('/dashboard/reports'),
      variant: "default" as const,
      category: "Analytics"
    },
    {
      title: "Schedule Meeting",
      description: "Calendar integration",
      icon: Calendar,
      onClick: () => navigate('/dashboard/calendar'),
      variant: "outline" as const,
      category: "Scheduling"
    },
    {
      title: "Team Communication",
      description: "Chat with colleagues",
      icon: MessageSquare,
      onClick: () => navigate('/dashboard/chat'),
      variant: "outline" as const,
      category: "Communication"
    },
    {
      title: "Export Profile",
      description: "Download as PDF",
      icon: Download,
      onClick: () => {
        // Mock PDF export functionality
        console.log("Exporting profile...");
      },
      variant: "outline" as const,
      category: "Export"
    },
    ...(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'superadmin' ? [{
      title: "Team Overview",
      description: "Manage team members",
      icon: Users,
      onClick: () => navigate('/dashboard/organization'),
      variant: "outline" as const,
      category: "Management"
    }] : []),
    {
      title: "Account Settings",
      description: "Privacy & security",
      icon: Settings,
      onClick: () => navigate('/dashboard/settings'),
      variant: "outline" as const,
      category: "Settings"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Professional Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                buttonVariants({ variant: action.variant }),
                "h-auto p-4 flex flex-col items-start gap-3 text-left hover:shadow-md transition-shadow"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{action.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalQuickActions;

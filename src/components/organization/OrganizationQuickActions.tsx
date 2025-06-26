
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Settings, BarChart3, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import InviteCodeDialog from './InviteCodeDialog';

const OrganizationQuickActions: React.FC = () => {
  const { user } = useAuth();

  const canCreateUsers = user && ['superadmin', 'admin'].includes(user.role);
  const canViewReports = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  const actions = [
    {
      to: "/dashboard/tasks",
      icon: Plus,
      label: "Create New Task",
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "hover:from-blue-600 hover:to-blue-700",
      available: true
    },
    {
      to: "/dashboard/projects",
      icon: Plus,
      label: "Create New Project",
      gradient: "from-green-500 to-green-600",
      hoverGradient: "hover:from-green-600 hover:to-green-700",
      available: true
    },
    {
      to: "/dashboard/reports",
      icon: BarChart3,
      label: "View Reports",
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "hover:from-purple-600 hover:to-purple-700",
      available: canViewReports
    }
  ];

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-card/90 dark:via-card/80 dark:to-card/70 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Quick Actions
          </span>
          <Sparkles className="h-4 w-4 text-accent animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => 
          action.available ? (
            <Link key={action.label} to={action.to}>
              <Button 
                className={`w-full justify-start bg-gradient-to-r ${action.gradient} ${action.hoverGradient} text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 group`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <action.icon className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium">{action.label}</span>
              </Button>
            </Link>
          ) : null
        )}

        {canCreateUsers && (
          <InviteCodeDialog>
            <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 group">
              <UserPlus className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-medium">Invite User</span>
            </Button>
          </InviteCodeDialog>
        )}

        {/* Additional Quick Stats */}
        <div className="pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground text-center">
            <span className="font-medium">Quick Access</span> • Manage your organization efficiently
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationQuickActions;

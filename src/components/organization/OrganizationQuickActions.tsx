
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Settings, BarChart3, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

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
    <div className="space-y-4">
      {actions.map((action, index) => 
        action.available ? (
          <Link key={action.label} to={action.to} className="block">
            <Button 
              className={`w-full justify-start bg-gradient-to-r ${action.gradient} ${action.hoverGradient} text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 border-0 group h-12`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <action.icon className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-medium">{action.label}</span>
            </Button>
          </Link>
        ) : null
      )}

      {/* Additional Info */}
      <div className="pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
          <Zap className="h-3 w-3" />
          <span className="font-medium">Quick Access</span>
          <span>•</span>
          <span>Manage efficiently</span>
        </div>
      </div>
    </div>
  );
};

export default OrganizationQuickActions;

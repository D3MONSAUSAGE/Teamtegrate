
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, FolderKanban, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProfileQuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      title: "Create Task",
      description: "Add a new task",
      icon: Plus,
      onClick: () => navigate('/dashboard/tasks/create'),
      variant: "default" as const
    },
    {
      title: "View My Tasks",
      description: "See all assigned tasks",
      icon: CheckSquare,
      onClick: () => navigate('/dashboard/tasks'),
      variant: "outline" as const
    },
    {
      title: "Browse Projects",
      description: "View active projects",
      icon: FolderKanban,
      onClick: () => navigate('/dashboard/projects'),
      variant: "outline" as const
    },
    ...(user?.role === 'manager' ? [{
      title: "Manage Team",
      description: "View team performance",
      icon: Users,
      onClick: () => navigate('/dashboard/team'),
      variant: "outline" as const
    }] : [])
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.onClick}
              className="h-auto p-4 flex flex-col items-center gap-2 text-center"
            >
              <action.icon className="h-6 w-6" />
              <div>
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileQuickActions;

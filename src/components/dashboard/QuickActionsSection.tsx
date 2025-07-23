
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, BarChart3 } from 'lucide-react';

interface QuickActionsSectionProps {
  onCreateTask: () => void;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ onCreateTask }) => {
  const actions = [
    {
      icon: Plus,
      title: 'Create Task',
      description: 'Add a new task to your project',
      onClick: onCreateTask
    },
    {
      icon: Calendar,
      title: 'Schedule Meeting',
      description: 'Plan a meeting with your team',
      onClick: () => console.log('Schedule meeting')
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage your team members',
      onClick: () => console.log('Team management')
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'View project analytics',
      onClick: () => console.log('Analytics')
    }
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={action.onClick}
              >
                <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsSection;

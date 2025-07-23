import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderPlus, 
  Calendar, 
  Users,
  BarChart3,
  Settings,
  Upload,
  MessageSquare
} from 'lucide-react';

interface ModernQuickActionsProps {
  onCreateTask: () => void;
}

const ModernQuickActions: React.FC<ModernQuickActionsProps> = ({ onCreateTask }) => {
  const primaryActions = [
    {
      title: 'New Task',
      description: 'Create a new task',
      icon: Plus,
      action: onCreateTask,
      gradient: 'from-dashboard-accent to-dashboard-accent-light',
      featured: true
    },
    {
      title: 'New Project',
      description: 'Start a new project',
      icon: FolderPlus,
      action: () => console.log('Create project'),
      gradient: 'from-dashboard-info to-blue-400'
    }
  ];

  const secondaryActions = [
    { title: 'Schedule', icon: Calendar, action: () => console.log('Schedule') },
    { title: 'Team', icon: Users, action: () => console.log('Team') },
    { title: 'Analytics', icon: BarChart3, action: () => console.log('Analytics') },
    { title: 'Settings', icon: Settings, action: () => console.log('Settings') },
    { title: 'Upload', icon: Upload, action: () => console.log('Upload') },
    { title: 'Messages', icon: MessageSquare, action: () => console.log('Messages') }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Primary Actions */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {primaryActions.map((action) => (
          <Card 
            key={action.title}
            className="group relative overflow-hidden border-0 shadow-base hover:shadow-lg transition-all duration-300 bg-dashboard-card hover:bg-dashboard-card-hover cursor-pointer"
            onClick={action.action}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${action.featured ? 'shadow-glow' : ''}`}>
                  <action.icon className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Tools */}
      <Card className="border-0 shadow-base bg-dashboard-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Quick Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {secondaryActions.map((action) => (
            <Button
              key={action.title}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className="w-full justify-start gap-3 h-11 hover:bg-dashboard-card-hover transition-colors duration-200"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernQuickActions;
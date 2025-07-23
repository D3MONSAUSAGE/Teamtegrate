
import React from 'react';
import { motion } from 'framer-motion';
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
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InteractiveQuickActionsProps {
  onCreateTask: () => void;
}

const InteractiveQuickActions: React.FC<InteractiveQuickActionsProps> = ({ onCreateTask }) => {
  const { isReady, profileLoading } = useAuth();

  const handleCreateTask = () => {
    if (!isReady) {
      console.log('User not ready for task creation');
      return;
    }
    onCreateTask();
  };

  const primaryActions = [
    {
      title: 'New Task',
      description: 'Create a new task',
      icon: Plus,
      action: handleCreateTask,
      gradient: 'from-dashboard-accent to-dashboard-accent-light',
      featured: true,
      disabled: !isReady
    },
    {
      title: 'New Project',
      description: 'Start a new project',
      icon: FolderPlus,
      action: () => console.log('Create project'),
      gradient: 'from-dashboard-info to-blue-400',
      disabled: !isReady
    }
  ];

  const secondaryActions = [
    { title: 'Schedule', icon: Calendar, action: () => console.log('Schedule'), disabled: !isReady },
    { title: 'Team', icon: Users, action: () => console.log('Team'), disabled: !isReady },
    { title: 'Analytics', icon: BarChart3, action: () => console.log('Analytics'), disabled: !isReady },
    { title: 'Settings', icon: Settings, action: () => console.log('Settings'), disabled: !isReady },
    { title: 'Upload', icon: Upload, action: () => console.log('Upload'), disabled: !isReady },
    { title: 'Messages', icon: MessageSquare, action: () => console.log('Messages'), disabled: !isReady }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Primary Actions */}
      <div className="grid grid-cols-1 gap-4">
        {primaryActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`group relative overflow-hidden border-0 shadow-base hover:shadow-lg transition-all duration-300 bg-dashboard-card cursor-pointer ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dashboard-card-hover'
              }`}
              onClick={action.disabled ? undefined : action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center transition-transform duration-300 ${
                    action.disabled ? '' : 'group-hover:scale-110'
                  } ${action.featured ? 'shadow-glow' : ''}`}>
                    {profileLoading && action.title === 'New Task' ? (
                      <Loader2 className="h-7 w-7 text-white animate-spin" />
                    ) : (
                      <action.icon className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-foreground">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.disabled ? 'Loading...' : action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
              onClick={action.disabled ? undefined : action.action}
              disabled={action.disabled}
              className="w-full justify-start gap-3 h-11 hover:bg-dashboard-card-hover transition-colors duration-200 disabled:opacity-50"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InteractiveQuickActions;

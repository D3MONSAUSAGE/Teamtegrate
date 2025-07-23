
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface InteractiveQuickActionsProps {
  onCreateTask: () => void;
}

const InteractiveQuickActions: React.FC<InteractiveQuickActionsProps> = ({ onCreateTask }) => {
  const { isReady, profileLoading } = useAuth();
  const navigate = useNavigate();

  const handleCreateTask = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    onCreateTask();
  };

  const handleCreateProject = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    navigate('/dashboard/projects');
  };

  const handleSchedule = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    navigate('/dashboard/calendar');
  };

  const handleTeam = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    navigate('/dashboard/team');
  };

  const handleAnalytics = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    navigate('/dashboard/reports');
  };

  const handleSettings = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    navigate('/dashboard/settings');
  };

  const handleUpload = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    toast.info('Upload feature coming soon!');
  };

  const handleMessages = () => {
    if (!isReady) {
      toast.error('Please wait for your profile to load');
      return;
    }
    toast.info('Messages feature coming soon!');
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
      action: handleCreateProject,
      gradient: 'from-dashboard-info to-blue-400',
      disabled: !isReady
    }
  ];

  const secondaryActions = [
    { title: 'Schedule', icon: Calendar, action: handleSchedule, disabled: !isReady },
    { title: 'Team', icon: Users, action: handleTeam, disabled: !isReady },
    { title: 'Analytics', icon: BarChart3, action: handleAnalytics, disabled: !isReady },
    { title: 'Settings', icon: Settings, action: handleSettings, disabled: !isReady },
    { title: 'Upload', icon: Upload, action: handleUpload, disabled: !isReady },
    { title: 'Messages', icon: MessageSquare, action: handleMessages, disabled: !isReady }
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

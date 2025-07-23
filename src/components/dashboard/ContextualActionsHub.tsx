
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FolderPlus, 
  Calendar, 
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  Upload,
  UserPlus,
  Bell,
  Zap,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ContextualActionsHubProps {
  onCreateTask: () => void;
}

const ContextualActionsHub: React.FC<ContextualActionsHubProps> = ({ onCreateTask }) => {
  const { user } = useAuth();

  const getPrimaryActions = () => {
    const baseActions = [
      {
        title: 'Create Task',
        description: 'Add a new task to your workspace',
        icon: Plus,
        action: onCreateTask,
        gradient: 'from-dashboard-primary to-dashboard-primary-light',
        featured: true
      },
      {
        title: 'New Project',
        description: 'Start a new project initiative',
        icon: FolderPlus,
        action: () => console.log('Create project'),
        gradient: 'from-dashboard-teal to-dashboard-teal-light'
      }
    ];

    // Add role-specific actions
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      baseActions.push({
        title: 'Manage Team',
        description: 'Add or manage team members',
        icon: UserPlus,
        action: () => console.log('Manage team'),
        gradient: 'from-dashboard-purple to-dashboard-purple-light'
      });
    }

    return baseActions;
  };

  const getQuickActions = () => {
    const baseActions = [
      { title: 'Schedule Meeting', icon: Calendar, action: () => console.log('Schedule') },
      { title: 'Team Chat', icon: MessageSquare, action: () => console.log('Chat') },
      { title: 'Upload Files', icon: Upload, action: () => console.log('Upload') },
      { title: 'Analytics', icon: BarChart3, action: () => console.log('Analytics') }
    ];

    // Add admin-specific actions
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      baseActions.push(
        { title: 'Settings', icon: Settings, action: () => console.log('Settings') },
        { title: 'Notifications', icon: Bell, action: () => console.log('Notifications') }
      );
    }

    return baseActions;
  };

  const primaryActions = getPrimaryActions();
  const quickActions = getQuickActions();

  const rolePermissions = {
    user: ['create_task', 'view_projects'],
    manager: ['create_task', 'create_project', 'view_team'],
    admin: ['create_task', 'create_project', 'manage_team', 'view_analytics'],
    superadmin: ['all']
  };

  const currentPermissions = rolePermissions[user?.role as keyof typeof rolePermissions] || [];

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <Card className="border-0 shadow-base bg-dashboard-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-dashboard-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-dashboard-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-dashboard-gray-900">
                  Quick Actions
                </CardTitle>
                <p className="text-sm text-dashboard-gray-600">
                  Contextual actions for your role
                </p>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-dashboard-primary/10 text-dashboard-primary">
              {user?.role || 'user'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Featured Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primaryActions.map((action) => (
              <Card 
                key={action.title}
                className="group relative overflow-hidden border-0 bg-dashboard-gray-50 hover:bg-dashboard-card-hover cursor-pointer transition-all duration-300 hover:shadow-md"
                onClick={action.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${action.featured ? 'shadow-lg' : ''}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-dashboard-gray-900 group-hover:text-dashboard-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-dashboard-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tools */}
      <Card className="border-0 shadow-base bg-dashboard-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dashboard-teal/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-dashboard-teal" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-dashboard-gray-900">
                Quick Tools
              </CardTitle>
              <p className="text-sm text-dashboard-gray-600">
                Frequently used functions
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="ghost"
                onClick={action.action}
                className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-dashboard-card-hover transition-all duration-200 border border-dashboard-border hover:border-dashboard-primary/20"
              >
                <action.icon className="h-6 w-6 text-dashboard-gray-600" />
                <span className="text-sm font-medium text-dashboard-gray-900">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card className="border-0 shadow-base bg-dashboard-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dashboard-purple/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-dashboard-purple" />
              </div>
              <div>
                <p className="text-sm font-medium text-dashboard-gray-900">
                  Role: {user?.role || 'User'}
                </p>
                <p className="text-xs text-dashboard-gray-600">
                  {currentPermissions.length} permissions active
                </p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="border-dashboard-border hover:bg-dashboard-card-hover">
              View Permissions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContextualActionsHub;

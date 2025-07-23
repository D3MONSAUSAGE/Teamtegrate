
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Bell, 
  Settings, 
  Shield, 
  LogOut,
  Mail,
  Building,
  Calendar,
  Trophy,
  Clock
} from 'lucide-react';
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { calculateDailyScore } from '@/contexts/task/taskMetrics';
import { format } from 'date-fns';

const MobileProfilePage = () => {
  const { user, logout } = useAuth();
  const { tasks } = usePersonalTasks();
  
  const dailyScore = calculateDailyScore(tasks);
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  
  const profileItems = [
    {
      icon: Bell,
      label: 'Notifications',
      value: '3 unread',
      action: () => {}
    },
    {
      icon: Settings,
      label: 'Settings',
      value: 'Preferences',
      action: () => {}
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      value: 'Manage',
      action: () => {}
    }
  ];

  const statsItems = [
    {
      icon: Trophy,
      label: 'Daily Score',
      value: `${dailyScore.percentage}%`,
      color: 'text-yellow-600'
    },
    {
      icon: Clock,
      label: 'Completed Tasks',
      value: completedTasks,
      color: 'text-green-600'
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: format(new Date(user?.createdAt || new Date()), 'MMM yyyy'),
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user?.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Building className="h-4 w-4" />
                  {user?.organizationId || 'No Organization'}
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Settings & Preferences */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profileItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={item.action}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.value}</p>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {}}
            >
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Bottom padding for tab bar */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default MobileProfilePage;

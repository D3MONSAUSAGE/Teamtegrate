
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, User, LogOut, Shield, Briefcase } from 'lucide-react';
import MobileLayout from '@/components/mobile/MobileLayout';

const MobileProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotifications = () => {
    navigate('/notifications');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
        {/* Header */}
        <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe-area-inset-top">
          <div className="px-4 py-4">
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{user?.name || 'User'}</CardTitle>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {user?.role || 'User'}
                    </Badge>
                    {user?.organizationId && (
                      <Badge variant="outline">
                        <Briefcase className="h-3 w-3 mr-1" />
                        Organization
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start h-12"
                onClick={handleNotifications}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 mr-3" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-12"
                onClick={handleSettings}
              >
                <Settings className="h-5 w-5 mr-3" />
                <span>Settings</span>
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span>Sign Out</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileProfilePage;

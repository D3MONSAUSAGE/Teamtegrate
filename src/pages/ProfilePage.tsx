
import React from 'react';
import { Capacitor } from '@capacitor/core';
import MobileProfilePage from './MobileProfilePage';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Briefcase, Mail } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const isMobile = Capacitor.isNativePlatform() || window.innerWidth < 768;

  // Return mobile version for mobile devices
  if (isMobile) {
    return <MobileProfilePage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/3 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full px-2 sm:px-4 lg:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="animate-fade-in delay-200">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{user?.name || 'User'}</CardTitle>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {user?.role || 'User'}
                    </Badge>
                    {user?.organizationId && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        Organization Member
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

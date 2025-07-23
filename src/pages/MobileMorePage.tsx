
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  FileText,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  MessageSquare,
  Bookmark,
  Archive,
  Download
} from 'lucide-react';

const MobileMorePage = () => {
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: Calendar,
      label: 'Calendar',
      description: 'View your schedule',
      path: '/calendar',
      badge: null
    },
    {
      icon: FileText,
      label: 'Projects',
      description: 'Manage projects',
      path: '/projects',
      badge: null
    },
    {
      icon: Users,
      label: 'Team',
      description: 'Team management',
      path: '/team',
      badge: null
    },
    {
      icon: BarChart3,
      label: 'Reports',
      description: 'Analytics & insights',
      path: '/reports',
      badge: null
    }
  ];

  const secondaryFeatures = [
    {
      icon: MessageSquare,
      label: 'Chat',
      description: 'Team communication',
      path: '/chat',
      badge: '2'
    },
    {
      icon: Bookmark,
      label: 'Saved Items',
      description: 'Bookmarked content',
      path: '/saved',
      badge: null
    },
    {
      icon: Archive,
      label: 'Archive',
      description: 'Archived items',
      path: '/archive',
      badge: null
    },
    {
      icon: Download,
      label: 'Downloads',
      description: 'Downloaded files',
      path: '/downloads',
      badge: null
    }
  ];

  const supportItems = [
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get help',
      action: () => {}
    },
    {
      icon: Settings,
      label: 'App Settings',
      description: 'Configure app',
      action: () => {}
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-6">
        {/* Main Features */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Main Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handleNavigation(feature.path)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  {feature.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {feature.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Secondary Features */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tools & Utilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {secondaryFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handleNavigation(feature.path)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  {feature.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {feature.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Support & Settings */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Support & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {supportItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4"
                  onClick={item.action}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">TeamTegrate</h3>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              <p className="text-xs text-muted-foreground">
                Professional task management and team collaboration
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom padding for tab bar */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default MobileMorePage;

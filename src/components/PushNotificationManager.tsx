
import React, { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, TestTube, Settings, Smartphone, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Link } from 'react-router-dom';

const PushNotificationManager: React.FC = () => {
  const { pushToken, isRegistered, permissionStatus, unregister, testNotification, requestPermissions } = usePushNotifications();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isRegistered && pushToken && user) {
      console.log('Push notifications registered successfully');
      toast.success('🔔 Push notifications are now active!', {
        description: 'You\'ll receive notifications even when the app is closed.',
        duration: 4000,
      });
    }
  }, [isRegistered, pushToken, user]);

  // Show settings panel on mobile devices for easier testing
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setShowSettings(true);
    }
  }, []);

  // Don't show if dismissed or hidden
  if (!showSettings || isDismissed) {
    return null;
  }

  const handleEnableNotifications = async () => {
    const success = await requestPermissions();
    if (!success) {
      toast.error('Please enable notifications in your device settings to receive push notifications.');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const getStatusColor = () => {
    if (isRegistered) return 'text-green-600';
    if (permissionStatus === 'denied') return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusText = () => {
    if (isRegistered) return 'Active';
    if (permissionStatus === 'denied') return 'Disabled';
    if (permissionStatus === 'granted') return 'Pending Registration';
    return 'Not Configured';
  };

  return (
    <Card className={`
      fixed bottom-4 right-4 w-80 z-50 shadow-lg border-2 
      transition-all duration-300 ease-in-out
      ${isDismissed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
    `}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4" />
            Push Notifications
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Status: <span className={getStatusColor()}>{getStatusText()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {!isRegistered && permissionStatus !== 'denied' && (
          <Button 
            onClick={handleEnableNotifications}
            size="sm" 
            className="w-full"
          >
            <Bell className="h-3 w-3 mr-2" />
            Enable Notifications
          </Button>
        )}
        
        {isRegistered && (
          <div className="space-y-2">
            <Button 
              onClick={testNotification}
              size="sm" 
              variant="outline" 
              className="w-full"
            >
              <TestTube className="h-3 w-3 mr-2" />
              Test Notification
            </Button>
            <Button 
              onClick={unregister}
              size="sm" 
              variant="destructive" 
              className="w-full"
            >
              <BellOff className="h-3 w-3 mr-2" />
              Disable Notifications
            </Button>
          </div>
        )}
        
        {permissionStatus === 'denied' && (
          <div className="text-xs text-muted-foreground">
            Notifications are disabled. Please enable them in your device settings.
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" variant="ghost" className="flex-1">
            <Link to="/mobile-setup">
              <Smartphone className="h-3 w-3 mr-1" />
              Setup Guide
            </Link>
          </Button>
          <Button size="sm" variant="ghost" className="flex-1">
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
        </div>
        
        {pushToken && (
          <div className="text-xs text-muted-foreground break-all">
            Token: {pushToken.substring(0, 20)}...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationManager;


import React, { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, TestTube, Settings, Smartphone, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Capacitor } from '@capacitor/core';
import { Link } from 'react-router-dom';

const PushNotificationManager: React.FC = () => {
  const { 
    pushToken, 
    isRegistered, 
    permissionStatus, 
    unregister, 
    testNotification, 
    requestPermissions,
    fcmToken,
    fcmSupported,
    fcmRegistering,
    fcmError,
    registerFCMToken,
    testFCMNotification
  } = usePushNotifications();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const hasNotifications = (fcmSupported && fcmToken) || isRegistered;
    if (hasNotifications && user) {
      console.log('Push notifications registered successfully');
      toast.success('🔔 Push notifications are now active!', {
        description: fcmSupported ? 'FCM notifications enabled for enhanced delivery.' : 'Basic notifications enabled.',
        duration: 4000,
      });
    }
  }, [fcmToken, isRegistered, user, fcmSupported]);

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
    try {
      if (fcmSupported) {
        await registerFCMToken();
      } else {
        const success = await requestPermissions();
        if (!success) {
          toast.error('Please enable notifications in your device settings to receive push notifications.');
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const handleTestNotification = async () => {
    try {
      if (fcmSupported && fcmToken) {
        await testFCMNotification();
      } else {
        await testNotification();
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const getStatusColor = () => {
    if (fcmError) return 'text-red-600';
    if (fcmSupported && fcmToken) return 'text-green-600';
    if (isRegistered) return 'text-yellow-600';
    if (permissionStatus === 'denied') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (fcmError) return 'FCM Error';
    if (fcmRegistering) return 'Registering...';
    if (fcmSupported && fcmToken) return 'FCM Active';
    if (isRegistered) return 'Basic Active';
    if (permissionStatus === 'denied') return 'Disabled';
    if (permissionStatus === 'granted') return 'Pending Registration';
    return 'Not Configured';
  };

  const getStatusIcon = () => {
    if (fcmError) return <AlertCircle className="h-3 w-3 text-red-600" />;
    if (fcmSupported && fcmToken) return <CheckCircle className="h-3 w-3 text-green-600" />;
    if (isRegistered) return <Bell className="h-3 w-3 text-yellow-600" />;
    return <BellOff className="h-3 w-3 text-gray-600" />;
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
            {fcmSupported && (
              <Badge variant="secondary" className="text-xs">FCM</Badge>
            )}
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
        <CardDescription className="text-xs flex items-center gap-1">
          {getStatusIcon()}
          Status: <span className={getStatusColor()}>{getStatusText()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {!(fcmSupported && fcmToken) && !isRegistered && permissionStatus !== 'denied' && (
          <Button 
            onClick={handleEnableNotifications}
            size="sm" 
            className="w-full"
            disabled={fcmRegistering}
          >
            <Bell className="h-3 w-3 mr-2" />
            {fcmRegistering ? 'Registering...' : 'Enable Notifications'}
          </Button>
        )}
        
        {((fcmSupported && fcmToken) || isRegistered) && (
          <div className="space-y-2">
            <Button 
              onClick={handleTestNotification}
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
        
        {fcmError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>FCM Error:</strong> {fcmError}
          </div>
        )}
        
        {permissionStatus === 'denied' && !fcmError && (
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
        
        {(fcmToken || pushToken) && (
          <div className="text-xs text-muted-foreground break-all space-y-1">
            {fcmToken && (
              <div>FCM Token: {fcmToken.substring(0, 20)}...</div>
            )}
            {pushToken && pushToken !== fcmToken && (
              <div>Legacy Token: {pushToken.substring(0, 20)}...</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationManager;

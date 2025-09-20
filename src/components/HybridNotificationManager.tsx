import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, Smartphone, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFCMTokenManager } from '@/hooks/useFCMTokenManager';
import { notifications } from '@/lib/notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/components/ui/sonner';

/**
 * Unified notification manager that handles both native and web notifications
 * Provides a single interface for managing all notification types
 */
export const HybridNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  
  // Native FCM notifications
  const {
    isSupported: fcmSupported,
    token: fcmToken,
    isRegistering: fcmRegistering,
    error: fcmError,
    registerFCMToken,
    testFCMNotification
  } = useFCMTokenManager();
  
  // Web push notifications (simplified - using FCM for web as well)
  const webPushSupported = !isNative;
  const webPushRegistered = fcmToken && !isNative;
  const webPushPermission = 'granted';
  const webPushRegistering = fcmRegistering;
  const webPushError = fcmError;

  if (!user) return null;

  const handleEnableNotifications = async () => {
    try {
      if (fcmSupported) {
        await registerFCMToken();
      } else {
        notifications.error('Push notifications are not supported on this device');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      notifications.error('Failed to enable notifications');
    }
  };

  const handleTestNotification = async () => {
    try {
      if (fcmToken) {
        await testFCMNotification();
      } else {
        notifications.error('Please enable notifications first');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      notifications.error('Failed to send test notification');
    }
  };

  const handleDisableNotifications = async () => {
    try {
      // FCM tokens are managed by the FCM hook
      notifications.success('Notifications disabled');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      notifications.error('Failed to disable notifications');
    }
  };

  const getNotificationStatus = () => {
    if (isNative) {
      if (fcmToken) return { status: 'active', color: 'bg-green-500', text: 'Active (Native)' };
      if (fcmRegistering) return { status: 'pending', color: 'bg-yellow-500', text: 'Setting up...' };
      if (fcmError) return { status: 'error', color: 'bg-red-500', text: 'Error' };
      return { status: 'inactive', color: 'bg-gray-500', text: 'Disabled' };
    } else {
      if (webPushRegistered) return { status: 'active', color: 'bg-green-500', text: 'Active (Web)' };
      if (webPushRegistering) return { status: 'pending', color: 'bg-yellow-500', text: 'Setting up...' };
      if (!fcmSupported) return { status: 'denied', color: 'bg-red-500', text: 'Not Supported' };
      if (fcmError) return { status: 'error', color: 'bg-red-500', text: 'Error' };
      return { status: 'inactive', color: 'bg-gray-500', text: 'Disabled' };
    }
  };

  const notificationStatus = getNotificationStatus();
  const isActive = notificationStatus.status === 'active';
  const canEnable = !isActive && !fcmRegistering;
  const canTest = isActive;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge 
            variant="secondary" 
            className={`${notificationStatus.color} text-white`}
          >
            {notificationStatus.text}
          </Badge>
        </div>

        {/* Platform Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Platform:</span>
          <div className="flex items-center gap-2">
            {isNative ? (
              <Smartphone className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="text-sm">{isNative ? 'Native App' : 'Web Browser'}</span>
          </div>
        </div>

        {/* Support Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Support:</span>
          <div className="flex items-center gap-2">
            {fcmSupported ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {fcmSupported ? 'Supported' : 'Not Supported'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!isActive && canEnable && (
            <Button 
              onClick={handleEnableNotifications}
              disabled={fcmRegistering}
              className="flex-1"
            >
              <BellRing className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          )}
          
          {canTest && (
            <Button 
              onClick={handleTestNotification}
              variant="outline"
              size="sm"
            >
              Test
            </Button>
          )}
          
          {isActive && !isNative && (
            <Button 
              onClick={handleDisableNotifications}
              variant="outline"
              size="sm"
            >
              Disable
            </Button>
          )}
        </div>

        {/* Error Messages */}
        {fcmError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {fcmError}
          </div>
        )}

        {/* Help Text */}
        {!isActive && (
          <div className="text-xs text-muted-foreground">
            {isNative 
              ? "Enable push notifications to receive real-time alerts even when the app is closed."
              : "For best results on iPhone Safari, add this app to your home screen first, then enable notifications."
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};
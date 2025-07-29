
import React, { useEffect } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNotificationChannels } from '@/hooks/useNotificationChannels';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, TestTube, Zap } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const SupabaseNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const { triggerTestNotification } = useRealtimeNotifications();
  
  // Initialize notification system
  useNotificationChannels();
  useBackgroundSync();

  if (!user || !Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-green-500" />
          Realtime Notifications
        </CardTitle>
        <CardDescription className="text-xs">
          Status: <span className="text-green-600">Active via Supabase</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="text-xs text-muted-foreground">
          ✅ Real-time updates enabled<br/>
          ✅ Local notifications ready<br/>
          ✅ Background sync active
        </div>
        
        <Button 
          onClick={triggerTestNotification}
          size="sm" 
          variant="outline" 
          className="w-full"
        >
          <TestTube className="h-3 w-3 mr-2" />
          Test Notification
        </Button>
        
        <div className="text-xs text-green-600 font-medium">
          🚀 Powered by Supabase Realtime
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseNotificationManager;

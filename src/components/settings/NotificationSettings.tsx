
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Clock, Calendar } from "lucide-react";
import TimezoneSelector from './TimezoneSelector';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { Skeleton } from "@/components/ui/skeleton";

const NotificationSettings: React.FC = () => {
  const { userTimezone, isLoading, isUpdating, updateUserTimezone } = useUserTimezone();

  const handleTimezoneChange = (newTimezone: string) => {
    updateUserTimezone(newTimezone);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage your notification preferences and timing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage your notification preferences and timing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timezone Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Time Zone Settings</Label>
          </div>
          <TimezoneSelector
            value={userTimezone}
            onChange={handleTimezoneChange}
            disabled={isUpdating}
          />
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Daily reminders</strong> will be sent at midnight in your local timezone. 
              Tasks due tomorrow and upcoming events will be included in your daily notifications.
            </p>
          </div>
        </div>

        {/* Notification Type Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Reminder Types</Label>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-reminders">Task Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about tasks due tomorrow
                </p>
              </div>
              <Switch id="task-reminders" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="event-reminders">Event Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about events starting tomorrow
                </p>
              </div>
              <Switch id="event-reminders" defaultChecked />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;

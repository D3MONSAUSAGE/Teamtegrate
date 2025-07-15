
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Clock, Calendar } from "lucide-react";
import TimezoneSelector from './TimezoneSelector';
import EmailPreferences from './EmailPreferences';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from 'react';

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { userTimezone, isLoading, isUpdating, updateUserTimezone } = useUserTimezone();
  const [emailPreferences, setEmailPreferences] = useState({
    dailyEmailEnabled: true,
    dailyEmailTime: '08:00'
  });
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Fetch email preferences
  useEffect(() => {
    const fetchEmailPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('daily_email_enabled, daily_email_time')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching email preferences:', error);
        } else {
          setEmailPreferences({
            dailyEmailEnabled: data.daily_email_enabled ?? true,
            dailyEmailTime: data.daily_email_time ?? '08:00:00'
          });
        }
      } catch (error) {
        console.error('Error in fetchEmailPreferences:', error);
      } finally {
        setIsLoadingEmail(false);
      }
    };

    fetchEmailPreferences();
  }, [user]);

  const handleTimezoneChange = (newTimezone: string) => {
    updateUserTimezone(newTimezone);
  };

  const handleEmailPreferencesUpdate = async (enabled: boolean, time: string) => {
    if (!user) return;

    setIsUpdatingEmail(true);
    try {
      // Ensure time is in HH:MM:SS format
      const formattedTime = time.includes(':') && time.split(':').length === 2 
        ? `${time}:00` 
        : time;

      const { error } = await supabase
        .from('users')
        .update({
          daily_email_enabled: enabled,
          daily_email_time: formattedTime
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setEmailPreferences({
        dailyEmailEnabled: enabled,
        dailyEmailTime: formattedTime
      });

      toast.success('Email preferences updated successfully');
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update email preferences');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  if (isLoading || isLoadingEmail) {
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
    <div className="space-y-6">
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

      {/* Email Preferences */}
      <EmailPreferences
        dailyEmailEnabled={emailPreferences.dailyEmailEnabled}
        dailyEmailTime={emailPreferences.dailyEmailTime.slice(0, 5)} // Remove seconds for display
        onUpdate={handleEmailPreferencesUpdate}
        isUpdating={isUpdatingEmail}
      />
    </div>
  );
};

export default NotificationSettings;

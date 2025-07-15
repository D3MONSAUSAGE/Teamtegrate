
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Clock, TestTube } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EmailPreferencesProps {
  dailyEmailEnabled: boolean;
  dailyEmailTime: string;
  onUpdate: (enabled: boolean, time: string) => void;
  isUpdating: boolean;
}

const EmailPreferences: React.FC<EmailPreferencesProps> = ({
  dailyEmailEnabled,
  dailyEmailTime,
  onUpdate,
  isUpdating
}) => {
  const { user } = useAuth();
  const [localEnabled, setLocalEnabled] = useState(dailyEmailEnabled);
  const [localTime, setLocalTime] = useState(dailyEmailTime);
  const [isSending, setIsSending] = useState(false);

  const handleSave = () => {
    onUpdate(localEnabled, localTime);
  };

  const hasChanges = localEnabled !== dailyEmailEnabled || localTime !== dailyEmailTime;

  const sendTestEmail = async () => {
    if (!user) return;

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-daily-task-email', {
        body: { user_id: user.id }
      });

      if (error) {
        throw error;
      }

      toast.success('Test email sent successfully! Check your inbox.');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Configure your daily task summary email settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="daily-email-enabled">Daily Email Summary</Label>
            <p className="text-sm text-muted-foreground">
              Receive a daily email with your task overview
            </p>
          </div>
          <Switch
            id="daily-email-enabled"
            checked={localEnabled}
            onCheckedChange={setLocalEnabled}
          />
        </div>

        {localEnabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daily-email-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Preferred Email Time
              </Label>
              <Input
                id="daily-email-time"
                type="time"
                value={localTime}
                onChange={(e) => setLocalTime(e.target.value)}
                className="w-48"
              />
              <p className="text-sm text-muted-foreground">
                Emails will be sent at this time in your local timezone
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                What's included in your daily email?
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Tasks due today</li>
                <li>• Tasks due tomorrow</li>
                <li>• Overdue tasks</li>
                <li>• Task priorities and project information</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isUpdating}
                size="sm"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                onClick={sendTestEmail}
                disabled={isSending || !dailyEmailEnabled}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailPreferences;

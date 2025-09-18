import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Settings, Clock, ArrowLeftRight, Download, Upload, Calendar, CheckSquare } from 'lucide-react';
import GoogleCalendarConnect from './GoogleCalendarConnect';

interface SyncPreferences {
  sync_meetings: boolean;
  sync_bidirectional: boolean;
  default_meeting_duration: number;
  auto_create_meet_links: boolean;
  sync_meeting_participants: boolean;
  import_external_events: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily';
  notification_preferences: {
    sync_success: boolean;
    sync_errors: boolean;
  };
  // Task sync preferences
  sync_tasks: boolean;
  sync_task_deadlines: boolean;
  sync_focus_time: boolean;
  sync_task_reminders: boolean;
  focus_time_duration: number;
  focus_time_advance_days: number;
  // Google Tasks integration
  sync_google_tasks: boolean;
  import_google_tasks: boolean;
  export_to_google_tasks: boolean;
}

interface GoogleCalendarSyncPreferencesProps {
  isConnected: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

const GoogleCalendarSyncPreferences: React.FC<GoogleCalendarSyncPreferencesProps> = ({
  isConnected,
  onConnectionChange
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SyncPreferences>({
    sync_meetings: true,
    sync_bidirectional: false,
    default_meeting_duration: 60,
    auto_create_meet_links: true,
    sync_meeting_participants: true,
    import_external_events: false,
    sync_frequency: 'realtime',
    notification_preferences: {
      sync_success: true,
      sync_errors: true,
    },
    // Task sync defaults
    sync_tasks: false,
    sync_task_deadlines: true,
    sync_focus_time: false,
    sync_task_reminders: false,
    focus_time_duration: 120,
    focus_time_advance_days: 2,
    // Google Tasks defaults
    sync_google_tasks: false,
    import_google_tasks: false,
    export_to_google_tasks: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (user && isConnected) {
      loadPreferences();
    }
  }, [user, isConnected]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('google_calendar_sync_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(prev => ({ ...prev, ...data }));
      } else {
        // Initialize preferences for new users
        await savePreferences(preferences);
      }
    } catch (error) {
      console.error('Error loading sync preferences:', error);
      toast.error('Failed to load sync preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences?: SyncPreferences) => {
    const prefsToSave = newPreferences || preferences;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('google_calendar_sync_preferences')
        .upsert({
          user_id: user?.id,
          organization_id: user?.organizationId,
          ...prefsToSave
        });

      if (error) throw error;
      toast.success('Sync preferences saved');
    } catch (error) {
      console.error('Error saving sync preferences:', error);
      toast.error('Failed to save sync preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleImportCalendar = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-calendar-sync-queue');
      
      if (error) throw error;
      
      toast.success('Calendar import initiated');
    } catch (error) {
      console.error('Error importing calendar:', error);
      toast.error('Failed to import Google Calendar events');
    } finally {
      setImporting(false);
    }
  };

  const updatePreference = (key: keyof SyncPreferences, value: any) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    savePreferences(updatedPreferences);
  };

  if (loading && isConnected) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading preferences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Google Calendar Sync Preferences
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to manage sync preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please connect your Google Calendar first to configure sync preferences.
          </p>
          <GoogleCalendarConnect onConnectionChange={onConnectionChange} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Calendar Sync Preferences
        </CardTitle>
        <CardDescription>
          Configure how your calendar syncs with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* Meeting Sync Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Meeting Synchronization
            </h4>
            
            <div className="space-y-4 ml-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Meeting Sync</Label>
                  <div className="text-sm text-muted-foreground">
                    Sync meetings between your calendar and Google Calendar
                  </div>
                </div>
                <Switch
                  checked={preferences.sync_meetings}
                  onCheckedChange={(checked) => updatePreference('sync_meetings', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Bidirectional Sync</Label>
                  <div className="text-sm text-muted-foreground">
                    Keep both calendars in sync automatically
                  </div>
                </div>
                <Switch
                  checked={preferences.sync_bidirectional}
                  onCheckedChange={(checked) => updatePreference('sync_bidirectional', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-create Google Meet Links</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically add Google Meet links to synced meetings
                  </div>
                </div>
                <Switch
                  checked={preferences.auto_create_meet_links}
                  onCheckedChange={(checked) => updatePreference('auto_create_meet_links', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Sync Meeting Participants</Label>
                  <div className="text-sm text-muted-foreground">
                    Include meeting participants as Google Calendar attendees
                  </div>
                </div>
                <Switch
                  checked={preferences.sync_meeting_participants}
                  onCheckedChange={(checked) => updatePreference('sync_meeting_participants', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Import External Events</Label>
                  <div className="text-sm text-muted-foreground">
                    Import events from your Google Calendar to this app
                  </div>
                </div>
                <Switch
                  checked={preferences.import_external_events}
                  onCheckedChange={(checked) => updatePreference('import_external_events', checked)}
                />
              </div>
            </div>
          </div>

          {/* Task Sync Section */}
          <div className="space-y-4 border-t pt-6">
            <h4 className="font-medium text-primary flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Task Synchronization
            </h4>
            
            <div className="space-y-4 ml-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Task Sync</Label>
                  <div className="text-sm text-muted-foreground">
                    Sync tasks to Google Calendar as events
                  </div>
                </div>
                <Switch
                  checked={preferences.sync_tasks}
                  onCheckedChange={(checked) => updatePreference('sync_tasks', checked)}
                />
              </div>

              {preferences.sync_tasks && (
                <div className="space-y-4 ml-4 border-l-2 border-muted pl-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Task Deadlines</Label>
                      <div className="text-xs text-muted-foreground">
                        Create calendar events for task deadlines
                      </div>
                    </div>
                    <Switch
                      checked={preferences.sync_task_deadlines}
                      onCheckedChange={(checked) => updatePreference('sync_task_deadlines', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Focus Time Blocks</Label>
                      <div className="text-xs text-muted-foreground">
                        Schedule focus time blocks for high-priority tasks
                      </div>
                    </div>
                    <Switch
                      checked={preferences.sync_focus_time}
                      onCheckedChange={(checked) => updatePreference('sync_focus_time', checked)}
                    />
                  </div>

                  {preferences.sync_focus_time && (
                    <div className="space-y-3 ml-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Focus Block Duration</Label>
                        <Select
                          value={preferences.focus_time_duration.toString()}
                          onValueChange={(value) => updatePreference('focus_time_duration', parseInt(value))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="180">3 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Schedule In Advance</Label>
                        <Select
                          value={preferences.focus_time_advance_days.toString()}
                          onValueChange={(value) => updatePreference('focus_time_advance_days', parseInt(value))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day before</SelectItem>
                            <SelectItem value="2">2 days before</SelectItem>
                            <SelectItem value="3">3 days before</SelectItem>
                            <SelectItem value="7">1 week before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Task Reminders</Label>
                      <div className="text-xs text-muted-foreground">
                        Create reminder events before task deadlines
                      </div>
                    </div>
                    <Switch
                      checked={preferences.sync_task_reminders}
                      onCheckedChange={(checked) => updatePreference('sync_task_reminders', checked)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Google Tasks Integration */}
          <div className="space-y-4 border-t pt-6">
            <h4 className="font-medium text-primary flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Google Tasks Integration
            </h4>
            
            <div className="space-y-4 ml-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Import from Google Tasks</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically import tasks from Google Tasks
                  </div>
                </div>
                <Switch
                  checked={preferences.import_google_tasks}
                  onCheckedChange={(checked) => updatePreference('import_google_tasks', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Export to Google Tasks</Label>
                  <div className="text-sm text-muted-foreground">
                    Create Google Tasks from your local tasks
                  </div>
                </div>
                <Switch
                  checked={preferences.export_to_google_tasks}
                  onCheckedChange={(checked) => updatePreference('export_to_google_tasks', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Bidirectional Sync</Label>
                  <div className="text-sm text-muted-foreground">
                    Keep Google Tasks and local tasks in sync
                  </div>
                </div>
                <Switch
                  checked={preferences.sync_google_tasks}
                  onCheckedChange={(checked) => updatePreference('sync_google_tasks', checked)}
                />
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="space-y-4 border-t pt-6">
            <h4 className="font-medium text-primary flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General Settings
            </h4>
            
            <div className="space-y-4 ml-6">
              <div className="space-y-3">
                <Label className="text-base">Default Meeting Duration</Label>
                <Select
                  value={preferences.default_meeting_duration.toString()}
                  onValueChange={(value) => updatePreference('default_meeting_duration', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Sync Frequency</Label>
                <Select
                  value={preferences.sync_frequency}
                  onValueChange={(value) => updatePreference('sync_frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Every hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Notification Preferences</Label>
                
                <div className="space-y-3 ml-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Sync Success Notifications</Label>
                      <div className="text-xs text-muted-foreground">
                        Get notified when sync completes successfully
                      </div>
                    </div>
                    <Switch
                      checked={preferences.notification_preferences.sync_success}
                      onCheckedChange={(checked) => updatePreference('notification_preferences', {
                        ...preferences.notification_preferences,
                        sync_success: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Sync Error Notifications</Label>
                      <div className="text-xs text-muted-foreground">
                        Get notified when sync encounters errors
                      </div>
                    </div>
                    <Switch
                      checked={preferences.notification_preferences.sync_errors}
                      onCheckedChange={(checked) => updatePreference('notification_preferences', {
                        ...preferences.notification_preferences,
                        sync_errors: checked
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Import Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Import Google Calendar Events</Label>
              <p className="text-sm text-muted-foreground">
                Import your existing Google Calendar events into the app
              </p>
            </div>
            <Button 
              onClick={handleImportCalendar}
              disabled={importing || saving}
              variant="outline"
            >
              {importing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import Now
                </>
              )}
            </Button>
          </div>
        </div>

        {saving && (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Saving preferences...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSyncPreferences;
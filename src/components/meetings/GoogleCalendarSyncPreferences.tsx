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
import { RefreshCw, Settings, Clock, ArrowLeftRight, Download, Upload } from 'lucide-react';

interface SyncPreferences {
  id?: string;
  sync_enabled: boolean;
  import_enabled: boolean;
  two_way_sync_enabled: boolean;
  calendar_id: string;
  sync_frequency_minutes: number;
  conflict_resolution_strategy: string;
}

interface GoogleCalendarSyncPreferencesProps {
  isConnected: boolean;
  onImportCalendar?: () => void;
}

const GoogleCalendarSyncPreferences: React.FC<GoogleCalendarSyncPreferencesProps> = ({
  isConnected,
  onImportCalendar
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SyncPreferences>({
    sync_enabled: true,
    import_enabled: true,
    two_way_sync_enabled: true,
    calendar_id: 'primary',
    sync_frequency_minutes: 15,
    conflict_resolution_strategy: 'latest_wins'
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
        setPreferences(data);
      } else {
        // Create default preferences
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
      const upsertData = {
        user_id: user?.id,
        organization_id: user?.organizationId,
        ...prefsToSave
      };

      const { error } = await supabase
        .from('google_calendar_sync_preferences')
        .upsert(upsertData);

      if (error) {
        throw error;
      }

      toast.success('Sync preferences saved');
    } catch (error) {
      console.error('Error saving sync preferences:', error);
      toast.error('Failed to save sync preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleImportCalendar = async () => {
    if (!isConnected) {
      toast.error('Please connect Google Calendar first');
      return;
    }

    setImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-from-google-calendar', {
        body: {
          userId: user?.id,
          calendarId: preferences.calendar_id
        }
      });

      if (error) {
        throw error;
      }

      const { imported = 0, updated = 0, total = 0 } = data;
      toast.success(`Import complete: ${imported} new meetings, ${updated} updated, ${total} total events processed`);
      
      if (onImportCalendar) {
        onImportCalendar();
      }
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

  if (loading) {
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
          <p className="text-muted-foreground">
            Please connect your Google Calendar first to configure sync preferences.
          </p>
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
        {/* Sync Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Export to Google Calendar
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync Teamtegrate meetings to Google Calendar
              </p>
            </div>
            <Switch
              checked={preferences.sync_enabled}
              onCheckedChange={(checked) => updatePreference('sync_enabled', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Import from Google Calendar
              </Label>
              <p className="text-sm text-muted-foreground">
                Import Google Calendar events into Teamtegrate
              </p>
            </div>
            <Switch
              checked={preferences.import_enabled}
              onCheckedChange={(checked) => updatePreference('import_enabled', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Two-way sync
              </Label>
              <p className="text-sm text-muted-foreground">
                Keep both calendars in sync automatically
              </p>
            </div>
            <Switch
              checked={preferences.two_way_sync_enabled}
              onCheckedChange={(checked) => updatePreference('two_way_sync_enabled', checked)}
              disabled={saving}
            />
          </div>
        </div>

        <Separator />

        {/* Sync Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Sync Frequency
            </Label>
            <Select 
              value={preferences.sync_frequency_minutes.toString()} 
              onValueChange={(value) => updatePreference('sync_frequency_minutes', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Every 5 minutes</SelectItem>
                <SelectItem value="15">Every 15 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every hour</SelectItem>
                <SelectItem value="240">Every 4 hours</SelectItem>
                <SelectItem value="1440">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conflict Resolution</Label>
            <Select 
              value={preferences.conflict_resolution_strategy} 
              onValueChange={(value: any) => updatePreference('conflict_resolution_strategy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest_wins">Latest change wins</SelectItem>
                <SelectItem value="teamtegrate_wins">Teamtegrate wins</SelectItem>
                <SelectItem value="google_wins">Google Calendar wins</SelectItem>
                <SelectItem value="manual">Manual resolution</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How to handle conflicts when the same event is modified in both systems
            </p>
          </div>
        </div>

        <Separator />

        {/* Import Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Import Google Calendar Events</Label>
              <p className="text-sm text-muted-foreground">
                Import your existing Google Calendar events into Teamtegrate
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
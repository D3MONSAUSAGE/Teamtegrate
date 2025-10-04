import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, QrCode } from 'lucide-react';

export const AttendanceSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [requireSchedule, setRequireSchedule] = useState(false);
  const [earlyMinutes, setEarlyMinutes] = useState(15);
  const [lateMinutes, setLateMinutes] = useState(15);
  const [qrExpiration, setQrExpiration] = useState(45);
  const [allowManagerAssisted, setAllowManagerAssisted] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_attendance_settings')
        .select('*')
        .eq('organization_id', user?.organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setRequireSchedule(data.require_schedule_for_clock_in);
        setEarlyMinutes(data.allow_early_clock_in_minutes);
        setLateMinutes(data.allow_late_clock_in_minutes);
        setQrExpiration(data.qr_expiration_seconds);
        setAllowManagerAssisted(data.allow_manager_assisted);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load attendance settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.organizationId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organization_attendance_settings')
        .upsert({
          organization_id: user.organizationId,
          require_schedule_for_clock_in: requireSchedule,
          allow_early_clock_in_minutes: earlyMinutes,
          allow_late_clock_in_minutes: lateMinutes,
          qr_expiration_seconds: qrExpiration,
          allow_manager_assisted: allowManagerAssisted,
        }, {
          onConflict: 'organization_id'
        });

      if (error) throw error;

      toast.success('Attendance settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save attendance settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Attendance Settings
        </CardTitle>
        <CardDescription>
          Configure how employees can clock in and out using QR codes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="require-schedule" className="font-medium">
              Require Active Schedule for Clock-In
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled, employees must have a scheduled shift to clock in
            </p>
          </div>
          <Switch
            id="require-schedule"
            checked={requireSchedule}
            onCheckedChange={setRequireSchedule}
          />
        </div>

        {requireSchedule && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
            <div className="space-y-2">
              <Label htmlFor="early-minutes">Early Clock-In Grace Period (minutes)</Label>
              <Input
                id="early-minutes"
                type="number"
                min="0"
                max="60"
                value={earlyMinutes}
                onChange={(e) => setEarlyMinutes(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                How early employees can clock in before their scheduled shift
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="late-minutes">Late Clock-In Grace Period (minutes)</Label>
              <Input
                id="late-minutes"
                type="number"
                min="0"
                max="60"
                value={lateMinutes}
                onChange={(e) => setLateMinutes(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                How late employees can clock in after their scheduled shift starts
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="qr-expiration">QR Code Expiration (seconds)</Label>
          <Input
            id="qr-expiration"
            type="number"
            min="15"
            max="300"
            value={qrExpiration}
            onChange={(e) => setQrExpiration(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            How long QR codes remain valid before expiring (15-300 seconds)
          </p>
        </div>

        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="manager-assisted">
              Allow Manager-Assisted Clock-In
            </Label>
            <p className="text-sm text-muted-foreground">
              Managers can generate QR codes for employees without phones
            </p>
          </div>
          <Switch
            id="manager-assisted"
            checked={allowManagerAssisted}
            onCheckedChange={setAllowManagerAssisted}
          />
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full" size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

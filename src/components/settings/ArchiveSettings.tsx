import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useArchiveSettings } from '@/hooks/useArchiveSettings';
import type { ArchiveThresholdOption } from '@/types/archive';

const ArchiveSettings = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useArchiveSettings();

  const handleThresholdChange = (value: string) => {
    const thresholdDays = parseInt(value) as ArchiveThresholdOption;
    if ([30, 60, 90, 180].includes(thresholdDays)) {
      updateSettings({
        thresholdDays,
        autoArchiveEnabled: settings?.autoArchiveEnabled ?? true
      });
    }
  };

  const handleAutoArchiveToggle = (enabled: boolean) => {
    updateSettings({
      thresholdDays: (settings?.thresholdDays ?? 90) as ArchiveThresholdOption,
      autoArchiveEnabled: enabled
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archive Settings</CardTitle>
        <CardDescription>
          Configure how and when your completed tasks are automatically archived.
          Archived tasks are hidden from main views but remain searchable and recoverable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Archive Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-archive">Automatic Archiving</Label>
            <p className="text-sm text-muted-foreground">
              Automatically archive completed tasks after the threshold period
            </p>
          </div>
          <Switch
            id="auto-archive"
            checked={settings?.autoArchiveEnabled ?? true}
            onCheckedChange={handleAutoArchiveToggle}
            disabled={isUpdating}
          />
        </div>

        {/* Threshold Selection */}
        <div className="space-y-2">
          <Label htmlFor="threshold">Archive Threshold</Label>
          <Select
            value={settings?.thresholdDays?.toString() ?? '90'}
            onValueChange={handleThresholdChange}
            disabled={isUpdating || !settings?.autoArchiveEnabled}
          >
            <SelectTrigger id="threshold">
              <SelectValue placeholder="Select threshold" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days (recommended)</SelectItem>
              <SelectItem value="180">180 days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Completed tasks will be archived after {settings?.thresholdDays ?? 90} days.
            {!settings?.autoArchiveEnabled && ' (Currently disabled)'}
          </p>
        </div>

        {/* Information */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">What happens when tasks are archived?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tasks are hidden from main task lists and dashboards</li>
            <li>• Archived tasks remain searchable and accessible in the Archive section</li>
            <li>• You can unarchive tasks at any time to restore them</li>
            <li>• Task data and attachments are preserved</li>
            <li>• Archive process runs daily during off-peak hours</li>
          </ul>
        </div>

        {/* Status Indicator */}
        {settings && (
          <div className="text-sm">
            <p className="text-muted-foreground">
              Current setting: {settings.autoArchiveEnabled ? 'Auto-archive enabled' : 'Auto-archive disabled'}
              {settings.autoArchiveEnabled && ` (${settings.thresholdDays} days)`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ArchiveSettings;
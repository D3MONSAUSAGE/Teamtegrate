import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Calendar, Bell, Settings } from 'lucide-react';
import type { TemplateFormData } from '../EnhancedTemplateDialog';

interface ScheduleConfigStepProps {
  formData: TemplateFormData;
  updateFormData: (updates: Partial<TemplateFormData>) => void;
}

const WEEKDAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

export const ScheduleConfigStep: React.FC<ScheduleConfigStepProps> = ({
  formData,
  updateFormData
}) => {
  const toggleDay = (dayId: string) => {
    const currentDays = formData.execution_days;
    const updatedDays = currentDays.includes(dayId)
      ? currentDays.filter(day => day !== dayId)
      : [...currentDays, dayId];
    
    updateFormData({ execution_days: updatedDays });
  };

  const updateNotificationSetting = (key: keyof TemplateFormData['notification_settings'], value: any) => {
    updateFormData({
      notification_settings: {
        ...formData.notification_settings,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Execution Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Execution Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Execution Frequency</Label>
            <Select
              value={formData.execution_frequency}
              onValueChange={(value: TemplateFormData['execution_frequency']) => 
                updateFormData({ execution_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (On Demand)</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days Selection for Weekly/Monthly */}
          {(formData.execution_frequency === 'weekly' || formData.execution_frequency === 'monthly') && (
            <div className="space-y-2">
              <Label>
                {formData.execution_frequency === 'weekly' ? 'Days of Week' : 'Days of Month'}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {WEEKDAYS.map(day => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={formData.execution_days.includes(day.id)}
                      onCheckedChange={() => toggleDay(day.id)}
                    />
                    <Label htmlFor={day.id} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Windows */}
          {formData.execution_frequency !== 'manual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={formData.execution_time_start}
                  onChange={(e) => updateFormData({ execution_time_start: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due-time">Due Time</Label>
                <Input
                  id="due-time"
                  type="time"
                  value={formData.execution_time_due}
                  onChange={(e) => updateFormData({ execution_time_due: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="window-hours">Execution Window (Hours)</Label>
            <Input
              id="window-hours"
              type="number"
              min="1"
              max="168"
              value={formData.execution_window_hours}
              onChange={(e) => updateFormData({ execution_window_hours: parseInt(e.target.value) || 24 })}
            />
            <p className="text-sm text-muted-foreground">
              How long teams have to complete the count after it starts
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="remind-hours">Remind Before (Hours)</Label>
            <Input
              id="remind-hours"
              type="number"
              min="0"
              max="48"
              value={formData.notification_settings.remind_before_hours}
              onChange={(e) => updateNotificationSetting('remind_before_hours', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="remind-overdue">Overdue Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications when counts are overdue
              </p>
            </div>
            <Switch
              id="remind-overdue"
              checked={formData.notification_settings.remind_overdue}
              onCheckedChange={(checked) => updateNotificationSetting('remind_overdue', checked)}
            />
          </div>

          {formData.notification_settings.remind_overdue && (
            <div className="space-y-2">
              <Label htmlFor="escalate-hours">Escalate After (Hours)</Label>
              <Input
                id="escalate-hours"
                type="number"
                min="1"
                max="168"
                value={formData.notification_settings.escalate_overdue_hours}
                onChange={(e) => updateNotificationSetting('escalate_overdue_hours', parseInt(e.target.value) || 24)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Schedule Preview</h4>
              <div className="text-sm text-muted-foreground mt-1">
                {formData.execution_frequency === 'manual' ? (
                  <p>This template will be available for manual execution only.</p>
                ) : (
                  <div className="space-y-1">
                    <p><strong>Frequency:</strong> {formData.execution_frequency}</p>
                    {formData.execution_days.length > 0 && (
                      <p><strong>On:</strong> {formData.execution_days.join(', ')}</p>
                    )}
                    <p><strong>Time Window:</strong> {formData.execution_time_start} - {formData.execution_time_due}</p>
                    <p><strong>Duration:</strong> {formData.execution_window_hours} hours to complete</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
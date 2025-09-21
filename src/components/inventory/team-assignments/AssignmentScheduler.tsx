import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryTemplate } from '@/contexts/inventory/types';
import { 
  Calendar,
  Clock,
  Repeat,
  Users,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';

interface AssignmentSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: InventoryTemplate[];
  teams: any[];
  onSchedule?: (schedule: ScheduleConfig) => void;
}

interface ScheduleConfig {
  name: string;
  templateId: string;
  teamIds: string[];
  startDate: string;
  recurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: number[];
  endDate?: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
  notifications: boolean;
  reminderHours: number;
  notes?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export const AssignmentScheduler: React.FC<AssignmentSchedulerProps> = ({
  open,
  onOpenChange,
  templates,
  teams,
  onSchedule
}) => {
  const [config, setConfig] = useState<ScheduleConfig>({
    name: '',
    templateId: '',
    teamIds: [],
    startDate: new Date().toISOString().split('T')[0],
    recurring: false,
    recurringType: 'weekly',
    recurringDays: [1, 2, 3, 4, 5], // Weekdays by default
    time: '09:00',
    priority: 'medium',
    notifications: true,
    reminderHours: 24,
  });
  
  const [loading, setLoading] = useState(false);

  const updateConfig = (updates: Partial<ScheduleConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleTeamToggle = (teamId: string) => {
    updateConfig({
      teamIds: config.teamIds.includes(teamId)
        ? config.teamIds.filter(id => id !== teamId)
        : [...config.teamIds, teamId]
    });
  };

  const handleDayToggle = (day: number) => {
    updateConfig({
      recurringDays: config.recurringDays?.includes(day)
        ? config.recurringDays.filter(d => d !== day)
        : [...(config.recurringDays || []), day]
    });
  };

  const handleSchedule = async () => {
    if (!config.name || !config.templateId || config.teamIds.length === 0) return;

    setLoading(true);
    try {
      await onSchedule?.(config);
      onOpenChange(false);
      // Reset form
      setConfig({
        name: '',
        templateId: '',
        teamIds: [],
        startDate: new Date().toISOString().split('T')[0],
        recurring: false,
        recurringType: 'weekly',
        recurringDays: [1, 2, 3, 4, 5],
        time: '09:00',
        priority: 'medium',
        notifications: true,
        reminderHours: 24,
      });
    } catch (error) {
      console.error('Error scheduling assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === config.templateId);
  const canSchedule = config.name && config.templateId && config.teamIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Inventory Assignments
          </DialogTitle>
          <DialogDescription>
            Create automated scheduling for recurring inventory counts across multiple teams.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Setup</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Schedule Name */}
            <div className="space-y-2">
              <Label>Schedule Name</Label>
              <Input
                placeholder="e.g., Weekly Store Inventory"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
              />
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Inventory Template</Label>
              <Select value={config.templateId} onValueChange={(value) => updateConfig({ templateId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Selection */}
            <div className="space-y-2">
              <Label>Teams to Include</Label>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {teams.map((team) => (
                      <div key={team.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`team-${team.id}`}
                          checked={config.teamIds.includes(team.id)}
                          onCheckedChange={() => handleTeamToggle(team.id)}
                        />
                        <label
                          htmlFor={`team-${team.id}`}
                          className="flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-sm">{team.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {team.member_count}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {config.teamIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      {config.teamIds.length} team{config.teamIds.length > 1 ? 's' : ''} selected
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority Level</Label>
              <Select value={config.priority} onValueChange={(value: 'low' | 'medium' | 'high') => updateConfig({ priority: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            {/* Start Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => updateConfig({ startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assignment Time</Label>
                <Input
                  type="time"
                  value={config.time}
                  onChange={(e) => updateConfig({ time: e.target.value })}
                />
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={config.recurring}
                  onCheckedChange={(checked) => updateConfig({ recurring: checked as boolean })}
                />
                <Label htmlFor="recurring" className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Make this a recurring schedule
                </Label>
              </div>

              {config.recurring && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recurrence Pattern</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={config.recurringType}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => updateConfig({ recurringType: value })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {config.recurringType === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Days of Week</Label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <Button
                              key={day.value}
                              variant={config.recurringDays?.includes(day.value) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleDayToggle(day.value)}
                            >
                              {day.short}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>End Date (Optional)</Label>
                      <Input
                        type="date"
                        value={config.endDate || ''}
                        onChange={(e) => updateConfig({ endDate: e.target.value || undefined })}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            {/* Notification Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notifications"
                  checked={config.notifications}
                  onCheckedChange={(checked) => updateConfig({ notifications: checked as boolean })}
                />
                <Label htmlFor="notifications">Send notifications to teams</Label>
              </div>

              {config.notifications && (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Reminder Time</Label>
                      <Select
                        value={config.reminderHours.toString()}
                        onValueChange={(value) => updateConfig({ reminderHours: parseInt(value) })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour before</SelectItem>
                          <SelectItem value="4">4 hours before</SelectItem>
                          <SelectItem value="24">1 day before</SelectItem>
                          <SelectItem value="48">2 days before</SelectItem>
                          <SelectItem value="168">1 week before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label>Instructions/Notes (Optional)</Label>
              <Input
                placeholder="Special instructions for teams..."
                value={config.notes || ''}
                onChange={(e) => updateConfig({ notes: e.target.value })}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary */}
        {canSchedule && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="text-sm">
                <h4 className="font-medium mb-2">Schedule Summary</h4>
                <div className="space-y-1 text-muted-foreground">
                  <p>• <strong>{config.name}</strong> using template "{selectedTemplate?.name}"</p>
                  <p>• Assigned to {config.teamIds.length} team{config.teamIds.length > 1 ? 's' : ''}</p>
                  <p>• Starting {config.startDate} at {config.time}</p>
                  {config.recurring && (
                    <p>• Recurring {config.recurringType}
                      {config.recurringType === 'weekly' && config.recurringDays && 
                        ` on ${config.recurringDays.map(d => DAYS_OF_WEEK[d].short).join(', ')}`
                      }
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!canSchedule || loading}
          >
            {loading ? 'Creating Schedule...' : 'Create Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
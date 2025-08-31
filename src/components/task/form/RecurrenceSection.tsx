
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RecurrenceSectionProps {
  isRecurring: boolean;
  onToggle: (value: boolean) => void;
  frequency: 'weekly' | 'daily' | 'monthly';
  onFrequencyChange: (value: 'weekly' | 'daily' | 'monthly') => void;
  interval: number;
  onIntervalChange: (value: number) => void;
  daysOfWeek: number[]; // 0=Sun ... 6=Sat
  onDaysChange: (days: number[]) => void;
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const RecurrenceSection: React.FC<RecurrenceSectionProps> = ({
  isRecurring,
  onToggle,
  frequency,
  onFrequencyChange,
  interval,
  onIntervalChange,
  daysOfWeek,
  onDaysChange,
}) => {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Repeat task</Label>
        <Switch checked={isRecurring} onCheckedChange={onToggle} />
      </div>

      {isRecurring && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Frequency</Label>
            <Select value={frequency} onValueChange={(v) => onFrequencyChange(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Every</Label>
            <input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => onIntervalChange(Math.max(1, Number(e.target.value)))}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {frequency === 'weekly' && (
            <div className="space-y-1">
              <Label className="text-xs">On</Label>
              <ToggleGroup
                type="multiple"
                className="justify-start"
                value={daysOfWeek.map(String)}
                onValueChange={(vals) => onDaysChange(vals.map(v => Number(v)))}
              >
                {dayLabels.map((d, idx) => (
                  <ToggleGroupItem key={idx} value={String(idx)} size="sm">
                    {d}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurrenceSection;

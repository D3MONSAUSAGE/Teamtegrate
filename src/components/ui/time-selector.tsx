
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TimeSelectorProps {
  value: string; // Format: "HH:mm" (24-hour format)
  onChange: (time: string) => void;
  className?: string;
  placeholder?: string;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  value,
  onChange,
  className,
  placeholder = "Select time"
}) => {
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');

  // Parse the value prop to set initial hour and minute
  useEffect(() => {
    if (value && value.includes(':')) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour);
      setSelectedMinute(minute);
    }
  }, [value]);

  // Update parent when hour or minute changes
  useEffect(() => {
    if (selectedHour && selectedMinute) {
      onChange(`${selectedHour}:${selectedMinute}`);
    }
  }, [selectedHour, selectedMinute, onChange]);

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    const display12 = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
    return { value: hour, label: `${hour}:00`, display: display12 };
  });

  // Generate minutes (00, 15, 30, 45)
  const minutes = [
    { value: '00', label: ':00' },
    { value: '15', label: ':15' },
    { value: '30', label: ':30' },
    { value: '45', label: ':45' }
  ];

  // Quick time presets
  const presets = [
    { label: '9:00 AM', value: '09:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '1:00 PM', value: '13:00' },
    { label: '5:00 PM', value: '17:00' },
    { label: '6:00 PM', value: '18:00' }
  ];

  const handlePresetClick = (presetValue: string) => {
    const [hour, minute] = presetValue.split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
  };

  const formatDisplayTime = () => {
    if (!selectedHour || !selectedMinute) return placeholder;
    
    const hour24 = parseInt(selectedHour);
    const isPM = hour24 >= 12;
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = isPM ? 'PM' : 'AM';
    
    return `${hour12}:${selectedMinute} ${period}`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
            className="text-xs px-2 py-1 h-7 hover:bg-primary/10 hover:border-primary/40"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Time Display and Selectors */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {formatDisplayTime()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Hour</label>
            <Select value={selectedHour} onValueChange={setSelectedHour}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {hours.map((hour) => (
                  <SelectItem key={hour.value} value={hour.value}>
                    <div className="flex justify-between w-full">
                      <span>{hour.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {hour.display}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Minute</label>
            <Select value={selectedMinute} onValueChange={setSelectedMinute}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((minute) => (
                  <SelectItem key={minute.value} value={minute.value}>
                    {minute.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSelector;

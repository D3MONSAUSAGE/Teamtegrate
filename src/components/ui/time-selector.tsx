
import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TimeSelectorProps {
  value: string; // Format: "HH:mm" (24-hour format)
  onChange: (time: string) => void;
  className?: string;
  placeholder?: string;
}

const isValidTime = (value: string): boolean => {
  return /^\d{2}:\d{2}$/.test(value);
};

const TimeSelector: React.FC<TimeSelectorProps> = ({
  value,
  onChange,
  className,
  placeholder = "Select time"
}) => {
  // Parse the current value to get hour and minute - handle empty/undefined values
  const parts = value && value.includes(':') ? value.split(':') : ['', ''];
  const currentHour = parts[0] || '';
  const currentMinute = parts[1] || '';

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    const display12Hour = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
    return { value: hour, label: display12Hour };
  });

  // Generate minute options (every 15 minutes for simplicity)
  const minuteOptions = Array.from({ length: 4 }, (_, i) => {
    const minute = (i * 15).toString().padStart(2, '0');
    return { value: minute, label: minute };
  });

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hour = e.target.value;
    const minute = currentMinute || '00';
    onChange(`${hour}:${minute}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const minute = e.target.value;
    const hour = currentHour || '09';
    onChange(`${hour}:${minute}`);
  };

  const getDisplayTime = () => {
    if (!currentHour || !currentMinute) {
      return placeholder;
    }
    const hourNum = parseInt(currentHour);
    const display12Hour = hourNum === 0 ? '12 AM' : hourNum < 12 ? `${hourNum} AM` : hourNum === 12 ? '12 PM' : `${hourNum - 12} PM`;
    return `${display12Hour.split(' ')[0]}:${currentMinute} ${display12Hour.split(' ')[1]}`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {getDisplayTime()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <select 
          value={currentHour} 
          onChange={handleHourChange}
          className="h-9 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Hour</option>
          {hourOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select 
          value={currentMinute} 
          onChange={handleMinuteChange}
          className="h-9 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Min</option>
          {minuteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TimeSelector;

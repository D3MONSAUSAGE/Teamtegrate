
import React from 'react';
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
  // Parse the current value to get hour and minute - handle empty values properly
  const [currentHour, currentMinute] = value && value.includes(':') ? value.split(':') : ['', ''];

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    const display12Hour = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
    return { value: hour, label: display12Hour };
  });

  // Generate minute options (every 5 minutes for better flexibility)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minute = (i * 5).toString().padStart(2, '0');
    return { value: minute, label: minute };
  });

  const handleHourChange = (hour: string) => {
    const minute = currentMinute || '00';
    onChange(`${hour}:${minute}`);
  };

  const handleMinuteChange = (minute: string) => {
    const hour = currentHour || '09';
    onChange(`${hour}:${minute}`);
  };

  const selectedHourOption = hourOptions.find(option => option.value === currentHour);
  const selectedMinuteOption = minuteOptions.find(option => option.value === currentMinute);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {value && selectedHourOption ? `${selectedHourOption.label.replace(' ', ':' + currentMinute + ' ')}` : placeholder}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Select value={currentHour} onValueChange={handleHourChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {hourOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentMinute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimeSelector;

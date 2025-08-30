import React, { useState } from 'react';
import { Check, Calendar, User, Users, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface CalendarItem {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  type: 'personal' | 'shared' | 'meeting';
}

interface CalendarListProps {
  className?: string;
}

const CalendarList: React.FC<CalendarListProps> = ({ className }) => {
  const [calendars, setCalendars] = useState<CalendarItem[]>([
    { id: 'personal', name: 'Personal Tasks', color: 'bg-blue-500', visible: true, type: 'personal' },
    { id: 'meetings', name: 'Meetings', color: 'bg-purple-500', visible: true, type: 'meeting' },
    { id: 'work', name: 'Work Schedule', color: 'bg-green-500', visible: true, type: 'shared' },
    { id: 'deadlines', name: 'Deadlines', color: 'bg-red-500', visible: true, type: 'personal' },
  ]);

  const toggleCalendarVisibility = (id: string) => {
    setCalendars(prev => prev.map(cal => 
      cal.id === id ? { ...cal, visible: !cal.visible } : cal
    ));
  };

  const getIcon = (type: CalendarItem['type']) => {
    switch (type) {
      case 'personal': return <User className="h-4 w-4" />;
      case 'shared': return <Users className="h-4 w-4" />;
      case 'meeting': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        My Calendars
      </h3>
      <div className="space-y-2">
        {calendars.map((calendar) => (
          <div key={calendar.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${calendar.color}`} />
                {getIcon(calendar.type)}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {calendar.name}
              </span>
            </div>
            <Switch
              checked={calendar.visible}
              onCheckedChange={() => toggleCalendarVisibility(calendar.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarList;
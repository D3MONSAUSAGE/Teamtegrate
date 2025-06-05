
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { CalendarEvent } from '@/types/events';
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useEvents } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateEventDialog from './CreateEventDialog';
import DayTasksEvents from './DayTasksEvents';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarView: React.FC = () => {
  const { tasks } = useTask();
  const { events } = useEvents();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<View>('month');
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  // Convert tasks and events to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const taskEvents: CalendarEvent[] = tasks.map(task => ({
      id: task.id,
      title: `Task: ${task.title}`,
      start: task.deadline,
      end: task.deadline,
      resource: {
        type: 'task' as const,
        data: task
      }
    }));

    const eventEvents: CalendarEvent[] = events.map(event => ({
      id: event.id,
      title: `Event: ${event.title}`,
      start: event.start_date,
      end: event.end_date,
      resource: {
        type: 'event' as const,
        data: event
      }
    }));

    return [...taskEvents, ...eventEvents];
  }, [tasks, events]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedDate(event.start);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const isTask = event.resource?.type === 'task';
    const isCompleted = isTask && event.resource?.data?.status === 'Completed';
    
    return {
      style: {
        backgroundColor: isTask ? (isCompleted ? '#22c55e' : '#3b82f6') : '#8b5cf6',
        borderRadius: '4px',
        opacity: isCompleted ? 0.7 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <Button onClick={() => setIsCreateEventOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onView={setCurrentView}
          view={currentView}
          eventPropGetter={eventStyleGetter}
          selectable
        />
      </div>

      {selectedDate && (
        <DayTasksEvents selectedDate={selectedDate} />
      )}

      <CreateEventDialog
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default CalendarView;

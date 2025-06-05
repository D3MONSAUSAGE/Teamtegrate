
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { useTask } from '@/contexts/task';
import { useEvents } from '@/hooks/useEvents';
import { format, isSameDay } from 'date-fns';

interface DayTasksEventsProps {
  selectedDate: Date;
}

const DayTasksEvents: React.FC<DayTasksEventsProps> = ({ selectedDate }) => {
  const { tasks } = useTask();
  const { events, deleteEvent } = useEvents();

  const dayTasks = useMemo(() => {
    return tasks.filter(task => isSameDay(task.deadline, selectedDate));
  }, [tasks, selectedDate]);

  const dayEvents = useMemo(() => {
    return events.filter(event => 
      isSameDay(event.start_date, selectedDate) || 
      isSameDay(event.end_date, selectedDate) ||
      (event.start_date <= selectedDate && event.end_date >= selectedDate)
    );
  }, [events, selectedDate]);

  if (dayTasks.length === 0 && dayEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(selectedDate, 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No tasks or events scheduled for this day.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {format(selectedDate, 'MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dayTasks.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tasks ({dayTasks.length})
            </h4>
            <div className="space-y-2">
              {dayTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <h5 className="font-medium">{task.title}</h5>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant={task.status === 'Completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(task.deadline, 'h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayEvents.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events ({dayEvents.length})
            </h4>
            <div className="space-y-2">
              {dayEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-medium">{event.title}</h5>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      {format(event.start_date, 'h:mm a')} - {format(event.end_date, 'h:mm a')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEvent(event.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DayTasksEvents;


import React from 'react';
import { Task } from '@/types';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { 
  format, 
  isSameDay, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday,
  isWeekend
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CalendarTaskItem from './CalendarTaskItem';
import { CompactMeetingIndicator } from '@/components/meetings/CompactMeetingIndicator';
import { cn } from '@/lib/utils';
import { Plus, Calendar } from 'lucide-react';

interface CalendarWeekViewProps {
  selectedDate: Date;
  tasks: Task[];
  meetings: MeetingRequestWithParticipants[];
  onTaskClick: (task: Task) => void;
  onDateCreate: (date: Date) => void;
  onMeetingClick?: () => void;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({ 
  selectedDate,
  tasks,
  meetings,
  onTaskClick,
  onDateCreate,
  onMeetingClick
}) => {
  const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const endOfWeekDate = endOfWeek(selectedDate, { weekStartsOn: 0 });
  
  const weekDays = eachDayOfInterval({
    start: startOfWeekDate,
    end: endOfWeekDate
  });
  
  return (
    <Card className="h-full flex flex-col shadow-xl border-0 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3 flex-shrink-0 px-4 py-4 md:px-6 md:py-5 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Week of {format(startOfWeekDate, 'MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Day headers with persistent add buttons */}
        <div className="grid grid-cols-7 flex-shrink-0 border-b bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20">
          {weekDays.map((day, i) => (
            <div key={i} className={cn(
              "text-center p-3 md:p-4 border-r last:border-r-0 font-semibold transition-colors duration-200 relative group",
              isWeekend(day) && "bg-gradient-to-b from-muted/20 to-transparent text-muted-foreground",
              isToday(day) && "bg-gradient-to-b from-primary/20 to-primary/5"
            )}>
              <div className="mb-1 text-xs md:text-sm text-muted-foreground font-medium">
                {format(day, 'EEE')}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className={cn(
                  "h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-200",
                  isToday(day) && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg scale-110 ring-2 ring-primary/30",
                  !isToday(day) && "hover:bg-gradient-to-br hover:from-primary/20 hover:to-secondary/20 hover:scale-105"
                )}>
                  {format(day, 'd')}
                </div>
                {/* Always visible add button */}
                <button
                  onClick={() => onDateCreate(day)}
                  className="opacity-60 hover:opacity-100 transition-all duration-200 p-1 rounded-full hover:bg-primary/20 hover:scale-110"
                  title="Add task"
                >
                  <Plus className="h-3 w-3 text-primary" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Enhanced Week content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 divide-x min-h-full">
            {weekDays.map((day, dayIndex) => {
              const dayTasks = tasks.filter(task => {
                try {
                  const taskDeadline = new Date(task.deadline);
                  return isSameDay(taskDeadline, day);
                } catch (error) {
                  console.error("Invalid date for task in week view:", task.id);
                  return false;
                }
              });

              const dayMeetings = meetings.filter(meeting => {
                try {
                  const meetingStart = new Date(meeting.start_time);
                  return isSameDay(meetingStart, day);
                } catch (error) {
                  console.error("Invalid date for meeting in week view:", meeting.id);
                  return false;
                }
              });
              
              const isWeekendDay = isWeekend(day);
              
              return (
                <div key={dayIndex} className={cn(
                  "min-h-[140px] md:min-h-[180px] p-2 md:p-3 transition-all duration-200 relative",
                  "hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5",
                  isWeekendDay && "bg-gradient-to-b from-muted/10 to-background"
                )}>
                  {/* Task density indicator */}
                  {dayTasks.length > 0 && (
                    <div className={cn(
                      "absolute top-0 right-0 w-1 h-full bg-gradient-to-b transition-opacity duration-300",
                      dayTasks.length <= 2 ? "from-blue-300 to-blue-400 opacity-30" :
                      dayTasks.length <= 4 ? "from-amber-300 to-amber-400 opacity-50" :
                      "from-rose-300 to-rose-400 opacity-70"
                    )} />
                  )}
                  
                  <div className="space-y-2">
                    {/* Show meeting indicator first if there are meetings */}
                    {dayMeetings.length > 0 && (
                         <CompactMeetingIndicator 
                           meetings={dayMeetings}
                           onClick={onMeetingClick}
                         />
                    )}
                    
                    {/* Task list */}
                    {dayTasks.length > 0 ? (
                      dayTasks.map(task => (
                        <CalendarTaskItem 
                          key={task.id} 
                          task={task} 
                          compact={true}
                          onClick={() => onTaskClick(task)}
                        />
                      ))
                    ) : dayMeetings.length === 0 ? (
                      <div 
                        className="group/empty py-3 md:py-4 text-xs text-center text-muted-foreground cursor-pointer hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10 rounded-lg flex items-center justify-center gap-1 border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-all duration-200 min-h-[50px] hover:scale-105"
                        onClick={() => onDateCreate(day)}
                      >
                        <Plus className="h-4 w-4 group-hover/empty:scale-110 transition-transform" />
                        <span className="hidden sm:inline font-medium">Add task</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarWeekView;


import React from 'react';
import { Task } from '@/types';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { 
  format, 
  isSameDay, 
  isSameMonth,
  startOfMonth, 
  endOfMonth,
  startOfWeek,
  endOfWeek, 
  eachDayOfInterval,
  isToday,
  isWeekend
} from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import CalendarTaskItem from './CalendarTaskItem';
import { CompactMeetingIndicator } from '@/components/meetings/CompactMeetingIndicator';
import { Plus, Calendar } from 'lucide-react';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';

interface CalendarMonthViewProps {
  selectedDate: Date;
  tasks: Task[];
  meetings: MeetingRequestWithParticipants[];
  onTaskClick: (task: Task) => void;
  onDateCreate: (date: Date) => void;
  onMeetingClick?: () => void;
}

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ 
  selectedDate,
  tasks,
  meetings,
  onTaskClick,
  onDateCreate,
  onMeetingClick
}) => {
  const { updateTask } = useTask();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    try {
      // Set deadline to end of target date
      const newDeadline = new Date(targetDate);
      newDeadline.setHours(23, 59, 59, 999);
      
      await updateTask(taskId, {
        deadline: newDeadline
      });
      
      toast.success('Task rescheduled successfully');
    } catch (error) {
      console.error('Error rescheduling task:', error);
      toast.error('Failed to reschedule task');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getTaskDensity = (dayTasks: Task[]) => {
    if (dayTasks.length === 0) return 'opacity-0';
    if (dayTasks.length <= 2) return 'opacity-20';
    if (dayTasks.length <= 4) return 'opacity-40';
    return 'opacity-60';
  };
  
  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-xl border-0 bg-gradient-to-br from-background to-muted/30">
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Day headers */}
        <div className="grid grid-cols-7 border-b bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 flex-shrink-0">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, i) => (
            <div key={i} className={cn(
              "text-center p-3 md:p-4 font-bold text-sm md:text-base border-r last:border-r-0 bg-gradient-to-b from-background/50 to-transparent",
              isWeekend(new Date(2024, 0, i)) && "bg-gradient-to-b from-muted/20 to-transparent text-muted-foreground"
            )}>
              <div className="hidden sm:block">{dayName}</div>
              <div className="sm:hidden font-semibold">{dayName.slice(0, 3)}</div>
            </div>
          ))}
        </div>
        
        {/* Enhanced Calendar grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 auto-rows-[120px] sm:auto-rows-[140px] md:auto-rows-[160px]">
            {days.map((day, i) => {
              const dayTasks = tasks.filter(task => {
                try {
                  const taskDeadline = new Date(task.deadline);
                  return isSameDay(taskDeadline, day);
                } catch (error) {
                  console.error("Invalid date for task in month view:", task.id);
                  return false;
                }
              });

              const dayMeetings = meetings.filter(meeting => {
                try {
                  const meetingStart = new Date(meeting.start_time);
                  return isSameDay(meetingStart, day);
                } catch (error) {
                  console.error("Invalid date for meeting in month view:", meeting.id);
                  return false;
                }
              });
              
              const withinCurrentMonth = isSameMonth(day, selectedDate);
              const isWeekendDay = isWeekend(day);
              const maxVisibleTasks = 2;
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "group border-b border-r last:border-r-0 p-1 md:p-2 relative transition-all duration-200 overflow-hidden",
                    "hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5 hover:shadow-inner",
                    !withinCurrentMonth && "bg-muted/10 text-muted-foreground",
                    isWeekendDay && withinCurrentMonth && "bg-gradient-to-br from-muted/10 to-background",
                    "hover:scale-[1.01] hover:z-10"
                  )}
                  onDrop={(e) => handleDrop(e, day)}
                  onDragOver={handleDragOver}
                >
                  {/* Task density heatmap background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 transition-opacity duration-300",
                    getTaskDensity(dayTasks)
                  )} />
                  
                  {/* Day number and persistent add button */}
                  <div className="relative flex justify-between items-start mb-1 z-10">
                    <span className={cn(
                      "inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-sm md:text-base font-bold transition-all duration-200 relative",
                      isToday(day) && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg scale-110 ring-2 ring-primary/30",
                      !isToday(day) && withinCurrentMonth && "hover:bg-gradient-to-br hover:from-primary/20 hover:to-secondary/20 hover:scale-105",
                      !withinCurrentMonth && "text-muted-foreground/60"
                    )}>
                      {format(day, 'd')}
                      {isToday(day) && (
                        <div className="absolute -inset-1 bg-primary/20 rounded-full animate-pulse" />
                      )}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      {/* Task count badge */}
                      {dayTasks.length > 0 && (
                        <div className="relative">
                          <div className="text-xs text-primary font-bold bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm rounded-full h-5 w-5 flex items-center justify-center border border-primary/30">
                            {dayTasks.length}
                          </div>
                          {dayTasks.some(task => task.priority === 'High') && (
                            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-rose-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      )}
                      
                      {/* Always visible add button */}
                      <button
                        onClick={() => onDateCreate(day)}
                        className="group/add opacity-60 hover:opacity-100 transition-all duration-200 p-1 rounded-full hover:bg-primary/20 hover:scale-110"
                        title="Add task"
                      >
                        <Plus className="h-3 w-3 text-primary group-hover/add:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Enhanced Tasks and Meetings */}
                  <div className="relative space-y-1 overflow-hidden z-10">
                    {/* Show meeting indicator first if there are meetings */}
                    {dayMeetings.length > 0 && (
                      <div className="mb-1">
                        <CompactMeetingIndicator 
                          meetings={dayMeetings}
                          onClick={onMeetingClick}
                        />
                      </div>
                    )}
                    
                    {/* Task list */}
                    {dayTasks.slice(0, maxVisibleTasks).map(task => (
                      <CalendarTaskItem 
                        key={task.id} 
                        task={task}
                        minimal={true}
                        onClick={() => onTaskClick(task)}
                        draggable={true}
                      />
                    ))}
                    {dayTasks.length > maxVisibleTasks && (
                      <div 
                        className="text-xs text-primary cursor-pointer hover:text-primary/80 px-2 py-1 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 text-center font-bold border border-primary/20 hover:border-primary/40 transition-all duration-200 hover:scale-105"
                        onClick={() => {
                          if (dayTasks[maxVisibleTasks]) onTaskClick(dayTasks[maxVisibleTasks]);
                        }}
                      >
                        +{dayTasks.length - maxVisibleTasks} more
                      </div>
                    )}
                    {dayTasks.length === 0 && dayMeetings.length === 0 && (
                      <div 
                        className="group/add py-2 md:py-3 text-xs text-center text-muted-foreground cursor-pointer hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10 rounded-lg flex items-center justify-center gap-1 border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-all duration-200 min-h-[32px] md:min-h-[40px] hover:scale-105"
                        onClick={() => onDateCreate(day)}
                      >
                        <Plus className="h-3 w-3 group-hover/add:scale-110 transition-transform" />
                        <span className="hidden md:inline text-xs font-medium">Add task</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarMonthView;

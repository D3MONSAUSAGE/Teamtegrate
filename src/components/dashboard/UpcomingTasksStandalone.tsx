import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import TaskCard from '@/components/task-card';
import { Task } from '@/types';
import { Plus, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import { useDebounce } from '@/utils/performanceUtils';
import { cn } from '@/lib/utils';

interface UpcomingTasksStandaloneProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => Promise<void>;
}

const UpcomingTasksStandalone: React.FC<UpcomingTasksStandaloneProps> = ({
  tasks,
  onCreateTask,
  onEditTask,
  onStatusChange
}) => {
  const isMobile = useIsMobile();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Debounced handlers to prevent rapid clicking
  const debouncedOpenDetails = useDebounce((task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  }, 200);

  const debouncedEditTask = useDebounce((task: Task) => {
    onEditTask(task);
  }, 200);

  // Memoized handlers
  const handleOpenDetails = useMemo(() => debouncedOpenDetails, [debouncedOpenDetails]);
  const handleEditTask = useMemo(() => debouncedEditTask, [debouncedEditTask]);
  
  return (
    <div className={`
      space-y-6 bg-gradient-to-br from-purple-50/40 via-purple-50/20 to-pink-50/40 
      dark:from-purple-950/20 dark:via-purple-950/10 dark:to-pink-950/20 
      rounded-2xl backdrop-blur-sm
      ${isMobile ? 'p-4' : 'p-6'}
    `}>
      <div className={`
        flex items-center justify-between
        ${isMobile ? 'flex-col gap-3 items-start' : ''}
      `}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Clock className={`text-purple-600 dark:text-purple-400 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          <h2 className={`
            font-semibold bg-gradient-to-r from-foreground to-purple-600 bg-clip-text text-transparent
            ${isMobile ? 'text-lg' : 'text-xl'}
          `}>
            Upcoming Tasks
          </h2>
        </div>
        <Link to="/dashboard/tasks">
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "sm"} 
            className={`
              text-purple-600 hover:bg-purple-500/10 transition-colors
              ${isMobile ? 'mobile-touch-target' : ''}
            `}
          >
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className={cn(
          "grid gap-4",
          "grid-cols-1",
          "sm:grid-cols-2",
          "lg:grid-cols-3",
          "xl:grid-cols-4"
        )}>
          {tasks.slice(0, 6).map((task) => (
            <TaskCard 
              key={task.id}
              task={task} 
              onEdit={() => handleEditTask(task)}
              onStatusChange={onStatusChange}
              onClick={() => handleOpenDetails(task)} 
            />
          ))}
        </div>
      ) : (
        <div className={`
          bg-gradient-to-br from-purple-100/70 via-purple-100/50 to-pink-100/70 
          dark:from-purple-900/30 dark:via-purple-900/20 dark:to-pink-900/30 
          backdrop-blur-sm border rounded-2xl text-center
          ${isMobile ? 'p-6' : 'p-8'}
        `}>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <Clock className={`text-purple-600 dark:text-purple-400 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            </div>
            <div className="space-y-2">
              <h3 className={`font-semibold text-card-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                No upcoming tasks
              </h3>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                All caught up! Ready to plan your next tasks?
              </p>
            </div>
            <Button 
              variant="outline" 
              size={isMobile ? "default" : "default"}
              className={`
                mt-2 hover:bg-purple-500/10 hover:border-purple-500 transition-colors
                ${isMobile ? 'mobile-touch-target' : ''}
              `}
              onClick={onCreateTask}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
      )}
      
      <TaskDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        task={selectedTask}
        onEdit={handleEditTask}
      />
    </div>
  );
};

export default UpcomingTasksStandalone;
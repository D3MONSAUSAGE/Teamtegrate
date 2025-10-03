import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import TaskCard from '@/components/task-card';
import { Task } from '@/types';
import { Plus, ChevronRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import { useDebounce } from '@/utils/performanceUtils';
import { cn } from '@/lib/utils';

interface OverdueTasksStandaloneProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => Promise<void>;
}

const OverdueTasksStandalone: React.FC<OverdueTasksStandaloneProps> = ({
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

  // Calculate completion percentage for overdue tasks
  const completedCount = tasks.filter(task => task.status === 'Completed').length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  return (
    <div className={`
      space-y-6 bg-gradient-to-br from-red-50/40 via-red-50/20 to-orange-50/40 
      dark:from-red-950/20 dark:via-red-950/10 dark:to-orange-950/20 
      rounded-2xl backdrop-blur-sm border border-red-200/30 dark:border-red-800/30
      ${isMobile ? 'p-4' : 'p-6'}
    `}>
      <div className={`
        flex items-center justify-between
        ${isMobile ? 'flex-col gap-3 items-start' : ''}
      `}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20">
            <AlertTriangle className={`text-red-600 dark:text-red-400 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          <div>
            <h2 className={`
              font-semibold bg-gradient-to-r from-foreground to-red-600 bg-clip-text text-transparent
              ${isMobile ? 'text-lg' : 'text-xl'}
            `}>
              Overdue Tasks
            </h2>
            {tasks.length > 0 && (
              <p className={`text-red-600 dark:text-red-400 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                {tasks.length} overdue • {completionPercentage}% complete
              </p>
            )}
          </div>
        </div>
        <Link to="/dashboard/tasks">
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "sm"} 
            className={`
              text-red-600 hover:bg-red-500/10 transition-colors
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
          "lg:grid-cols-3"
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
          bg-gradient-to-br from-green-100/70 via-green-100/50 to-emerald-100/70 
          dark:from-green-900/30 dark:via-green-900/20 dark:to-emerald-900/30 
          backdrop-blur-sm border border-green-200/50 dark:border-green-800/50 rounded-2xl text-center
          ${isMobile ? 'p-6' : 'p-8'}
        `}>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20">
              <AlertTriangle className={`text-green-600 dark:text-green-400 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            </div>
            <div className="space-y-2">
              <h3 className={`font-semibold text-card-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                No overdue tasks!
              </h3>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Great job staying on top of your deadlines
              </p>
            </div>
            <Button 
              variant="outline" 
              size={isMobile ? "default" : "default"}
              className={`
                mt-2 hover:bg-green-500/10 hover:border-green-500 transition-colors
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

export default OverdueTasksStandalone;
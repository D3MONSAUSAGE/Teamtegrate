
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import TaskCard from '@/components/task-card';
import { Task } from '@/types';
import { Plus, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import { useDebounce } from '@/utils/performanceUtils';

interface DailyTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const DailyTasksSection: React.FC<DailyTasksSectionProps> = ({
  tasks,
  onCreateTask,
  onEditTask
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
      space-y-6 bg-gradient-to-br from-blue-50/40 via-blue-50/20 to-purple-50/40 
      dark:from-blue-950/20 dark:via-blue-950/10 dark:to-purple-950/20 
      rounded-2xl backdrop-blur-sm
      ${isMobile ? 'p-4' : 'p-6'}
    `}>
      <div className={`
        flex items-center justify-between
        ${isMobile ? 'flex-col gap-3 items-start' : ''}
      `}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <Calendar className={`text-blue-600 dark:text-blue-400 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          <h2 className={`
            font-semibold bg-gradient-to-r from-foreground to-blue-600 bg-clip-text text-transparent
            ${isMobile ? 'text-lg' : 'text-xl'}
          `}>
            Today's Tasks
          </h2>
        </div>
        <Link to="/dashboard/tasks">
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "sm"} 
            className={`
              text-blue-600 hover:bg-blue-500/10 transition-colors
              ${isMobile ? 'mobile-touch-target' : ''}
            `}
          >
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className={`
          flex flex-col gap-3
        `}>
          {tasks.slice(0, 6).map((task) => (
            <div key={task.id} className={`
              group transition-all duration-200
              ${isMobile ? 'active:scale-[0.98]' : 'hover:scale-[1.01]'}
            `}>
              <TaskCard 
                task={task} 
                onEdit={() => handleEditTask(task)}
                onClick={() => handleOpenDetails(task)} 
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={`
          bg-gradient-to-br from-blue-100/70 via-blue-100/50 to-purple-100/70 
          dark:from-blue-900/30 dark:via-blue-900/20 dark:to-purple-900/30 
          backdrop-blur-sm border rounded-2xl text-center
          ${isMobile ? 'p-6' : 'p-8'}
        `}>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <Calendar className={`text-blue-600 dark:text-blue-400 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            </div>
            <div className="space-y-2">
              <h3 className={`font-semibold text-card-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                No tasks scheduled for today
              </h3>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Start your productive day by creating a new task
              </p>
            </div>
            <Button 
              variant="outline" 
              size={isMobile ? "default" : "default"}
              className={`
                mt-2 hover:bg-blue-500/10 hover:border-blue-500 transition-colors
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

export default DailyTasksSection;

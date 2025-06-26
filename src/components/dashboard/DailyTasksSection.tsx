
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import TaskCard from '@/components/task-card';
import { Task } from '@/types';
import { Plus, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskDetailDrawer from '@/components/task/TaskDetailDrawer';
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
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/40 via-blue-50/20 to-purple-50/40 dark:from-blue-950/20 dark:via-blue-950/10 dark:to-purple-950/20 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-blue-600 bg-clip-text text-transparent">
            Today's Tasks
          </h2>
        </div>
        <Link to="/dashboard/tasks">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-500/10 transition-colors">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="group transition-all duration-200 hover:scale-[1.01]">
              <TaskCard 
                task={task} 
                onEdit={() => handleEditTask(task)}
                onClick={() => handleOpenDetails(task)} 
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-100/70 via-blue-100/50 to-purple-100/70 dark:from-blue-900/30 dark:via-blue-900/20 dark:to-purple-900/30 backdrop-blur-sm border rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-card-foreground">No tasks scheduled for today</h3>
              <p className="text-muted-foreground text-sm">Start your productive day by creating a new task</p>
            </div>
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              className="mt-2 hover:bg-blue-500/10 hover:border-blue-500 transition-colors" 
              onClick={onCreateTask}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
      )}
      
      <TaskDetailDrawer
        open={showDetails}
        onOpenChange={setShowDetails}
        task={selectedTask}
      />
    </div>
  );
};

export default DailyTasksSection;

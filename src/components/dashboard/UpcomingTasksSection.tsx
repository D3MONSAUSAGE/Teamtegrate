
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import TaskCard from '@/components/TaskCard';
import { Task } from '@/types';
import { Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskDetailDrawer from '@/components/task/TaskDetailDrawer';

interface UpcomingTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const UpcomingTasksSection: React.FC<UpcomingTasksSectionProps> = ({
  tasks,
  onCreateTask,
  onEditTask
}) => {
  const isMobile = useIsMobile();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-semibold">Upcoming Tasks</h2>
        <Link to="/dashboard/tasks">
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {tasks.slice(0, isMobile ? 2 : 3).map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask}
              onClick={() => handleOpenDetails(task)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-card p-4 md:p-6 rounded-lg border text-center">
          <p className="text-gray-500 dark:text-gray-300 text-sm md:text-base">No upcoming tasks for the next 7 days</p>
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            className="mt-2" 
            onClick={onCreateTask}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
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

export default UpcomingTasksSection;

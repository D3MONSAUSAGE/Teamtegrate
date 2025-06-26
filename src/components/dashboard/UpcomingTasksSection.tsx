
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import TaskCard from '@/components/task-card';
import { Task } from '@/types';
import { Plus, ChevronRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskDetailDrawer from '@/components/task/TaskDetailDrawer';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';

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
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };
  
  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
    onEditTask(task);
  };

  const handleTaskDialogComplete = () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
  };
  
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-emerald-50/50 via-emerald-50/30 to-teal-50/50 dark:from-emerald-950/25 dark:via-emerald-950/15 dark:to-teal-950/25 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
            <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent">
            Upcoming Tasks
          </h2>
        </div>
        <Link to="/dashboard/tasks">
          <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-500/10 transition-colors">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tasks.slice(0, isMobile ? 2 : 3).map((task) => (
            <div key={task.id} className="group transition-all duration-300 hover:scale-[1.02]">
              <TaskCard 
                task={task} 
                onEdit={() => handleEditTask(task)}
                onClick={() => handleOpenDetails(task)} 
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-emerald-100/70 via-emerald-100/50 to-teal-100/70 dark:from-emerald-900/30 dark:via-emerald-900/20 dark:to-teal-900/30 backdrop-blur-sm border rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
              <CalendarDays className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-card-foreground">No upcoming tasks for the next 7 days</h3>
              <p className="text-muted-foreground text-sm">Plan ahead by creating tasks for the coming week</p>
            </div>
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              className="mt-2 hover:bg-emerald-500/10 hover:border-emerald-500 transition-colors" 
              onClick={handleCreateTask}
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

      <CreateTaskDialogEnhanced
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        onTaskComplete={handleTaskDialogComplete}
      />
    </div>
  );
};

export default UpcomingTasksSection;

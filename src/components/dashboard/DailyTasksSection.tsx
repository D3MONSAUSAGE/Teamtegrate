
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import TaskCard from '@/components/task-card';
import { Task } from '@/types';
import { Plus, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskDetailDrawer from '@/components/task/TaskDetailDrawer';
import CreateTaskDialogWithAI from '@/components/CreateTaskDialogWithAI';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-emerald-500/20">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Today's Tasks
          </h2>
        </div>
        <Link to="/dashboard/tasks">
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 transition-colors">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tasks.map((task) => (
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
        <div className="glass-card border shadow-lg bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-muted/50 to-muted/30">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-card-foreground">No tasks scheduled for today</h3>
              <p className="text-muted-foreground text-sm">Start your productive day by creating a new task</p>
            </div>
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              className="mt-2 hover:bg-primary/10 hover:border-primary transition-colors" 
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

      <CreateTaskDialogWithAI
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        onTaskComplete={handleTaskDialogComplete}
      />
    </div>
  );
};

export default DailyTasksSection;

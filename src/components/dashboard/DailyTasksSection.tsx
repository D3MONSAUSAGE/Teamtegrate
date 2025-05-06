
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TaskCard from '@/components/task-card';
import { Task } from '@/types';
import { Plus, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskDetailDrawer from '@/components/task/TaskDetailDrawer';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import { format } from 'date-fns';

interface DailyTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

const DailyTasksSection: React.FC<DailyTasksSectionProps> = ({
  tasks,
  onCreateTask,
  onEditTask,
  onRefresh,
  isLoading = false
}) => {
  const isMobile = useIsMobile();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Debug log to see when tasks change
  useEffect(() => {
    console.log('DailyTasksSection - tasks updated:', tasks.length, tasks.map(t => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline instanceof Date 
        ? format(t.deadline, 'yyyy-MM-dd') 
        : (t.deadline ? format(new Date(t.deadline), 'yyyy-MM-dd') : 'no date'),
      status: t.status
    })));
  }, [tasks]);

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

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      console.log('Today\'s tasks refreshed');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Today's Tasks</h2>
          <Link to="/dashboard/tasks">
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-card p-4 rounded-lg border">
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="h-2"></div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-semibold">Today's Tasks ({tasks.length})</h2>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh today's tasks</span>
            </Button>
          )}
        </div>
        <Link to="/dashboard/tasks">
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={() => handleEditTask(task)}
              onClick={() => handleOpenDetails(task)} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-card p-4 md:p-6 rounded-lg border text-center">
          <p className="text-gray-500 dark:text-gray-300 text-sm md:text-base">No tasks scheduled for today</p>
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            className="mt-2" 
            onClick={handleCreateTask}
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

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
      />
    </div>
  );
};

export default DailyTasksSection;

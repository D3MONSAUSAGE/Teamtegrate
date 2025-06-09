
import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/task-card';
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Rocket } from 'lucide-react';
import TaskDetailDrawer from './TaskDetailDrawer';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  emptyMessage?: string;
}

const TaskList = ({ tasks, onEdit, onNewTask, onStatusChange, emptyMessage = "No tasks" }: TaskListProps) => {
  // State to track which task is selected for details
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    if (onStatusChange) {
      console.log(`TaskList: Changing task ${taskId} status to ${status}`);
      onStatusChange(taskId, status);
    } else {
      console.warn("Status change handler not provided to TaskList");
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-gradient-to-br from-muted/20 via-background/40 to-muted/20 border border-border/30 p-12 rounded-3xl backdrop-blur-sm shadow-lg max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
            <Rocket className="h-10 w-10 text-primary animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-3">{emptyMessage}</h3>
          <p className="text-muted-foreground mb-8 text-base leading-relaxed">Ready to boost your productivity? Create your first task and get started!</p>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-12 px-8 bg-background/50 backdrop-blur-sm border-border/60 hover:bg-background/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold" 
            onClick={onNewTask}
          >
            <Plus className="h-5 w-5 mr-2" /> 
            Add Task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="animate-fade-in transform hover:scale-[1.02] transition-all duration-300"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            <TaskCard 
              task={task} 
              onEdit={onEdit} 
              onClick={() => handleOpenDetails(task)}
              onStatusChange={handleStatusChange}
            />
          </div>
        ))}
      </div>
      <TaskDetailDrawer
        open={showDetails}
        onOpenChange={setShowDetails}
        task={selectedTask}
      />
    </>
  );
};

export default TaskList;

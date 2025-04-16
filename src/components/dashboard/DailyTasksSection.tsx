
import React from 'react';
import { Button } from "@/components/ui/button";
import TaskCard from '@/components/TaskCard';
import { Task } from '@/types';
import { Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Today's Tasks</h2>
        <Link to="/dashboard/tasks">
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border text-center">
          <p className="text-gray-500">No tasks scheduled for today</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={onCreateTask}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
      )}
    </div>
  );
};

export default DailyTasksSection;

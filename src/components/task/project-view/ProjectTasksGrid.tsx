
import React from 'react';
import { Task, TaskStatus, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectTasksGridProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
  teamMembers: User[];
  isLoadingTeamMembers: boolean;
}

// Simple task card component since we don't have access to TaskCard
const SimpleTaskCard: React.FC<{
  task: Task;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => Promise<void>;
}> = ({ task, onEdit, onStatusChange }) => {
  return (
    <div className="p-3 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={onEdit}>
      <h4 className="font-medium text-sm mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
          {task.priority}
        </span>
        {task.assignedToName && (
          <span className="text-muted-foreground">
            {task.assignedToName}
          </span>
        )}
      </div>
    </div>
  );
};

const ProjectTasksGrid: React.FC<ProjectTasksGridProps> = ({
  todoTasks,
  inProgressTasks,
  completedTasks,
  onEditTask,
  onStatusChange,
  teamMembers,
  isLoadingTeamMembers
}) => {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'To Do':
        return 'border-yellow-200 bg-yellow-50';
      case 'In Progress':
        return 'border-blue-200 bg-blue-50';
      case 'Completed':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const renderTaskColumn = (tasks: Task[], status: TaskStatus, title: string) => (
    <Card className={`h-fit ${getStatusColor(status)}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          <span className="text-sm font-normal bg-white px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No {status.toLowerCase()} tasks
          </p>
        ) : (
          tasks.map((task) => (
            <SimpleTaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onStatusChange={(newStatus) => onStatusChange(task.id, newStatus)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {renderTaskColumn(todoTasks, 'To Do', 'To Do')}
      {renderTaskColumn(inProgressTasks, 'In Progress', 'In Progress')}
      {renderTaskColumn(completedTasks, 'Completed', 'Completed')}
    </div>
  );
};

export default ProjectTasksGrid;


import React from 'react';
import { Task, TaskStatus, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from '@/components/task-card/TaskCard';

interface ProjectTasksGridProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
  teamMembers: User[];
  isLoadingTeamMembers: boolean;
}

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

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await onStatusChange(taskId, status);
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
      <CardContent className="space-y-3 max-h-[80vh] overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No {status.toLowerCase()} tasks
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onStatusChange={handleStatusChange}
              showProjectInfo={false}
            />
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {renderTaskColumn(todoTasks, 'To Do', 'To Do')}
      {renderTaskColumn(inProgressTasks, 'In Progress', 'In Progress')}
      {renderTaskColumn(completedTasks, 'Completed', 'Completed')}
    </div>
  );
};

export default ProjectTasksGrid;

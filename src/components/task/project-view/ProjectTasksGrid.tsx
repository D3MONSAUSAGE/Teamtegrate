
import React from 'react';
import { Task, TaskStatus, User } from '@/types';
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
  // Combine all tasks into a single array
  const allTasks = [...todoTasks, ...inProgressTasks, ...completedTasks];

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await onStatusChange(taskId, status);
  };

  if (allTasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks in this project yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {allTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEditTask}
          onStatusChange={handleStatusChange}
          showProjectInfo={false}
        />
      ))}
    </div>
  );
};

export default ProjectTasksGrid;


import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import TaskHeader from './TaskHeader';
import TaskTabs from './TaskTabs';
import { Task } from '@/types';
import CreateTaskDialog from '../CreateTaskDialog';

const ProjectTasksView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { tasks } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);

  // Filter tasks by project
  const projectTasks = tasks.filter((task) => task.projectId === projectId);

  // Filter tasks by status
  const todoTasks = projectTasks.filter((task) => task.status === 'To Do');
  const inProgressTasks = projectTasks.filter((task) => task.status === 'In Progress');
  const pendingTasks = projectTasks.filter((task) => task.status === 'Pending');
  const completedTasks = projectTasks.filter((task) => task.status === 'Completed');

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  const [editingTask, setEditingTask] = React.useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState('deadline');

  return (
    <div className="p-6">
      <TaskHeader 
        onNewTask={() => {
          setEditingTask(undefined);
          setIsCreateTaskOpen(true);
        }}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      
      <TaskTabs
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        pendingTasks={pendingTasks}
        completedTasks={completedTasks}
        onEdit={handleEditTask}
        onNewTask={() => {
          setEditingTask(undefined);
          setIsCreateTaskOpen(true);
        }}
      />
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId ?? undefined}
      />
    </div>
  );
};

export default ProjectTasksView;


import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import TaskHeader from './TaskHeader';
import TaskTabs from './TaskTabs';
import { Task } from '@/types';
import CreateTaskDialogWithAI from '../CreateTaskDialogWithAI';

const ProjectTasksView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { tasks } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState('deadline');

  // Filter tasks by project
  const projectTasks = tasks.filter((task) => task.projectId === projectId);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  // Sort tasks based on the selected option
  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityValues = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'upcoming':
          const now = new Date().getTime();
          const deadlineA = new Date(a.deadline).getTime();
          const deadlineB = new Date(b.deadline).getTime();
          const timeToDeadlineA = deadlineA - now;
          const timeToDeadlineB = deadlineB - now;
          const upcomingA = timeToDeadlineA > 0 ? timeToDeadlineA : Number.MAX_SAFE_INTEGER;
          const upcomingB = timeToDeadlineB > 0 ? timeToDeadlineB : Number.MAX_SAFE_INTEGER;
          return upcomingA - upcomingB;
        default:
          return 0;
      }
    });
  };

  // Filter tasks by status
  const todoTasks = projectTasks.filter((task) => task.status === 'To Do');
  const inProgressTasks = projectTasks.filter((task) => task.status === 'In Progress');
  const pendingTasks = projectTasks.filter((task) => task.status === 'Pending');
  const completedTasks = projectTasks.filter((task) => task.status === 'Completed');

  // Sort filtered tasks
  const sortedTodo = sortTasks(todoTasks);
  const sortedInProgress = sortTasks(inProgressTasks);
  const sortedPending = sortTasks(pendingTasks);
  const sortedCompleted = sortTasks(completedTasks);

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
        todoTasks={sortedTodo}
        inProgressTasks={sortedInProgress}
        pendingTasks={sortedPending}
        completedTasks={sortedCompleted}
        onEdit={handleEditTask}
        onNewTask={() => {
          setEditingTask(undefined);
          setIsCreateTaskOpen(true);
        }}
      />
      
      <CreateTaskDialogWithAI
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId ?? undefined}
      />
    </div>
  );
};

export default ProjectTasksView;

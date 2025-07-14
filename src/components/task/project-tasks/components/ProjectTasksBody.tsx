
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Task, TaskStatus, User } from '@/types';
import TaskCard from '@/components/task-card/TaskCard';

interface ProjectTasksBodyProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  teamMembers: User[];
  onEditTask: (task: Task) => void;
  onTaskStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
}

const ProjectTasksBody: React.FC<ProjectTasksBodyProps> = ({
  todoTasks,
  inProgressTasks,
  completedTasks,
  teamMembers,
  onEditTask,
  onTaskStatusChange
}) => {
  const renderTaskList = (tasks: Task[], emptyMessage: string) => {
    if (tasks.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onStatusChange={onTaskStatusChange}
            showProjectInfo={false}
          />
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="todo" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="todo" className="flex items-center gap-2">
          To Do
          <Badge variant="secondary" className="ml-1">
            {todoTasks.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="progress" className="flex items-center gap-2">
          In Progress
          <Badge variant="secondary" className="ml-1">
            {inProgressTasks.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-2">
          Completed
          <Badge variant="secondary" className="ml-1">
            {completedTasks.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="todo" className="space-y-4">
        {renderTaskList(todoTasks, "No tasks to do")}
      </TabsContent>

      <TabsContent value="progress" className="space-y-4">
        {renderTaskList(inProgressTasks, "No tasks in progress")}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4">
        {renderTaskList(completedTasks, "No completed tasks")}
      </TabsContent>
    </Tabs>
  );
};

export default ProjectTasksBody;

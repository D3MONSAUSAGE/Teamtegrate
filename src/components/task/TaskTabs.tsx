
import React from "react";
import { Task, TaskStatus } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskList from "./TaskList";

interface TaskTabsProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  pendingTasks: Task[];
  completedTasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const TaskTabs: React.FC<TaskTabsProps> = ({
  todoTasks,
  inProgressTasks,
  pendingTasks,
  completedTasks,
  onEdit,
  onNewTask,
  onStatusChange,
}) => {
  return (
    <Tabs defaultValue="todo" className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="todo" className="relative">
          To Do
          {todoTasks.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {todoTasks.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="inprogress" className="relative">
          In Progress
          {inProgressTasks.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {inProgressTasks.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="pending" className="relative">
          Pending
          {pendingTasks.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {pendingTasks.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="relative">
          Completed
          {completedTasks.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {completedTasks.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="todo">
        <TaskList 
          tasks={todoTasks} 
          onEdit={onEdit} 
          onNewTask={onNewTask} 
          onStatusChange={onStatusChange}
          emptyMessage="No to-do tasks" 
        />
      </TabsContent>
      
      <TabsContent value="inprogress">
        <TaskList 
          tasks={inProgressTasks} 
          onEdit={onEdit} 
          onNewTask={onNewTask}
          onStatusChange={onStatusChange} 
          emptyMessage="No tasks in progress" 
        />
      </TabsContent>
      
      <TabsContent value="pending">
        <TaskList 
          tasks={pendingTasks} 
          onEdit={onEdit} 
          onNewTask={onNewTask}
          onStatusChange={onStatusChange} 
          emptyMessage="No pending tasks" 
        />
      </TabsContent>
      
      <TabsContent value="completed">
        <TaskList 
          tasks={completedTasks} 
          onEdit={onEdit} 
          onNewTask={onNewTask}
          onStatusChange={onStatusChange} 
          emptyMessage="No completed tasks" 
        />
      </TabsContent>
    </Tabs>
  );
};

export default TaskTabs;

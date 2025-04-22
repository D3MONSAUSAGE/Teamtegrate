
import React from 'react';
import { Task } from '@/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import TaskList from './TaskList';
import { useIsMobile } from '@/hooks/use-mobile';

interface TaskTabsProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  pendingTasks: Task[];
  completedTasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
}

const TaskTabs = ({ 
  todoTasks, 
  inProgressTasks, 
  pendingTasks, 
  completedTasks,
  onEdit,
  onNewTask
}: TaskTabsProps) => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="todo" className="w-full">
      <div className="overflow-x-auto pb-2 no-scrollbar">
        <TabsList className="mb-4 w-full flex-nowrap justify-start px-0 h-auto">
          <TabsTrigger 
            value="todo" 
            className={`${isMobile ? 'text-xs py-1.5 px-2' : ''} whitespace-nowrap`}
          >
            To Do ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger 
            value="inprogress" 
            className={`${isMobile ? 'text-xs py-1.5 px-2' : ''} whitespace-nowrap`}
          >
            In Progress ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className={`${isMobile ? 'text-xs py-1.5 px-2' : ''} whitespace-nowrap`}
          >
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className={`${isMobile ? 'text-xs py-1.5 px-2' : ''} whitespace-nowrap`}
          >
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="todo">
        <TaskList 
          tasks={todoTasks} 
          onEdit={onEdit} 
          onNewTask={onNewTask}
          emptyMessage="No to-do tasks"
        />
      </TabsContent>
      
      <TabsContent value="inprogress">
        <TaskList 
          tasks={inProgressTasks} 
          onEdit={onEdit} 
          onNewTask={onNewTask}
          emptyMessage="No in-progress tasks"
        />
      </TabsContent>
      
      <TabsContent value="pending">
        <TaskList 
          tasks={pendingTasks} 
          onEdit={onEdit} 
          onNewTask={onNewTask}
          emptyMessage="No pending tasks"
        />
      </TabsContent>
      
      <TabsContent value="completed">
        <TaskList 
          tasks={completedTasks} 
          onEdit={onEdit} 
          onNewTask={onNewTask}
          emptyMessage="No completed tasks"
        />
      </TabsContent>
    </Tabs>
  );
};

export default TaskTabs;

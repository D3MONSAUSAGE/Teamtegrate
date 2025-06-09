
import React from "react";
import { Task, TaskStatus } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskList from "./TaskList";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface TaskTabsProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const TaskTabs: React.FC<TaskTabsProps> = ({
  todoTasks,
  inProgressTasks,
  completedTasks,
  onEdit,
  onNewTask,
  onStatusChange,
}) => {
  return (
    <div className="p-6">
      <Tabs defaultValue="todo" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 h-12 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="todo" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 rounded-md"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span>To Do</span>
              {todoTasks.length > 0 && (
                <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                  {todoTasks.length}
                </div>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="inprogress" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 rounded-md"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>In Progress</span>
              {inProgressTasks.length > 0 && (
                <div className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                  {inProgressTasks.length}
                </div>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 rounded-md"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Completed</span>
              {completedTasks.length > 0 && (
                <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                  {completedTasks.length}
                </div>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-0">
          <TaskList 
            tasks={todoTasks} 
            onEdit={onEdit} 
            onNewTask={onNewTask} 
            onStatusChange={onStatusChange}
            emptyMessage="No to-do tasks" 
          />
        </TabsContent>
        
        <TabsContent value="inprogress" className="mt-0">
          <TaskList 
            tasks={inProgressTasks} 
            onEdit={onEdit} 
            onNewTask={onNewTask}
            onStatusChange={onStatusChange} 
            emptyMessage="No tasks in progress" 
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <TaskList 
            tasks={completedTasks} 
            onEdit={onEdit} 
            onNewTask={onNewTask}
            onStatusChange={onStatusChange} 
            emptyMessage="No completed tasks" 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskTabs;

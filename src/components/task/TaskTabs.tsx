
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
    <div className="p-6 md:p-8">
      <Tabs defaultValue="todo" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 h-12 bg-muted/50 backdrop-blur-sm rounded-xl border border-border/50">
          <TabsTrigger 
            value="todo" 
            className="relative data-[state=active]:bg-background/80 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">To Do</span>
              {todoTasks.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold">
                  {todoTasks.length}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="inprogress" 
            className="relative data-[state=active]:bg-background/80 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">In Progress</span>
              {inProgressTasks.length > 0 && (
                <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold">
                  {inProgressTasks.length}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="relative data-[state=active]:bg-background/80 data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Completed</span>
              {completedTasks.length > 0 && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold">
                  {completedTasks.length}
                </span>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-0">
          <div className="animate-fade-in">
            <TaskList 
              tasks={todoTasks} 
              onEdit={onEdit} 
              onNewTask={onNewTask} 
              onStatusChange={onStatusChange}
              emptyMessage="No to-do tasks" 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="inprogress" className="mt-0">
          <div className="animate-fade-in">
            <TaskList 
              tasks={inProgressTasks} 
              onEdit={onEdit} 
              onNewTask={onNewTask}
              onStatusChange={onStatusChange} 
              emptyMessage="No tasks in progress" 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <div className="animate-fade-in">
            <TaskList 
              tasks={completedTasks} 
              onEdit={onEdit} 
              onNewTask={onNewTask}
              onStatusChange={onStatusChange} 
              emptyMessage="No completed tasks" 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskTabs;

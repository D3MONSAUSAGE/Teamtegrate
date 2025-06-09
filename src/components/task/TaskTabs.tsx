
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
    <div className="p-8">
      <Tabs defaultValue="todo" className="w-full">
        <TabsList className="grid grid-cols-3 mb-10 h-16 bg-muted/30 rounded-2xl p-2 backdrop-blur-sm border border-border/30">
          <TabsTrigger 
            value="todo" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg h-12 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold">To Do</span>
              {todoTasks.length > 0 && (
                <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full font-bold min-w-[28px] text-center shadow-sm">
                  {todoTasks.length}
                </div>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="inprogress" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg h-12 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="font-semibold">In Progress</span>
              {inProgressTasks.length > 0 && (
                <div className="bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-800 dark:text-amber-200 text-sm px-3 py-1 rounded-full font-bold min-w-[28px] text-center shadow-sm">
                  {inProgressTasks.length}
                </div>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg h-12 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-semibold">Completed</span>
              {completedTasks.length > 0 && (
                <div className="bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200 text-sm px-3 py-1 rounded-full font-bold min-w-[28px] text-center shadow-sm">
                  {completedTasks.length}
                </div>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-0 animate-fade-in">
          <TaskList 
            tasks={todoTasks} 
            onEdit={onEdit} 
            onNewTask={onNewTask} 
            onStatusChange={onStatusChange}
            emptyMessage="No to-do tasks" 
          />
        </TabsContent>
        
        <TabsContent value="inprogress" className="mt-0 animate-fade-in">
          <TaskList 
            tasks={inProgressTasks} 
            onEdit={onEdit} 
            onNewTask={onNewTask}
            onStatusChange={onStatusChange} 
            emptyMessage="No tasks in progress" 
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0 animate-fade-in">
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

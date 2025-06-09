
import React from "react";
import { Task, TaskStatus } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskList from "./TaskList";
import { CheckCircle2, Clock, AlertCircle, Flame } from "lucide-react";

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
    <div className="p-6 md:p-10">
      <Tabs defaultValue="todo" className="w-full">
        <TabsList className="grid grid-cols-3 mb-10 h-16 bg-muted/30 backdrop-blur-sm rounded-2xl border border-border/40 p-2">
          <TabsTrigger 
            value="todo" 
            className="relative data-[state=active]:bg-background/90 data-[state=active]:shadow-lg transition-all duration-300 rounded-xl h-12 font-semibold"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-semibold">To Do</span>
              {todoTasks.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full min-w-[24px] h-6 flex items-center justify-center font-bold shadow-lg">
                  {todoTasks.length}
                </div>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="inprogress" 
            className="relative data-[state=active]:bg-background/90 data-[state=active]:shadow-lg transition-all duration-300 rounded-xl h-12 font-semibold"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Flame className="h-4 w-4 text-amber-600" />
              </div>
              <span className="font-semibold">In Progress</span>
              {inProgressTasks.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-3 py-1.5 rounded-full min-w-[24px] h-6 flex items-center justify-center font-bold shadow-lg">
                  {inProgressTasks.length}
                </div>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="relative data-[state=active]:bg-background/90 data-[state=active]:shadow-lg transition-all duration-300 rounded-xl h-12 font-semibold"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-semibold">Completed</span>
              {completedTasks.length > 0 && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-1.5 rounded-full min-w-[24px] h-6 flex items-center justify-center font-bold shadow-lg">
                  {completedTasks.length}
                </div>
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

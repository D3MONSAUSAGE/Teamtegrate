
import React from "react";
import { Task, TaskStatus } from "@/types";
import { MobileTabs, MobileTabsContent, MobileTabsList, MobileTabsTrigger } from "@/components/ui/mobile-tabs";
import TaskList from "../TaskList";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ProjectTasksTabsProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  onEdit: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
}

const ProjectTasksTabs: React.FC<ProjectTasksTabsProps> = ({
  todoTasks,
  inProgressTasks,
  completedTasks,
  onEdit,
  onStatusChange,
}) => {
  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <MobileTabs defaultValue="todo" className="w-full">
        <MobileTabsList>
          <MobileTabsTrigger 
            value="todo"
            icon={<AlertCircle className="h-full w-full" />}
            label="To Do"
            count={todoTasks.length}
            activeColor="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <MobileTabsTrigger 
            value="inprogress"
            icon={<Clock className="h-full w-full" />}
            label="In Progress"
            count={inProgressTasks.length}
            activeColor="bg-gradient-to-r from-amber-500 to-orange-500"
          />
          <MobileTabsTrigger 
            value="completed"
            icon={<CheckCircle2 className="h-full w-full" />}
            label="Completed"
            count={completedTasks.length}
            activeColor="bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </MobileTabsList>

        <MobileTabsContent value="todo">
          <TaskList 
            tasks={todoTasks} 
            onEdit={onEdit} 
            onNewTask={() => {}} // Empty function since Add Task is handled in the header
            onStatusChange={onStatusChange}
            emptyMessage="No to-do tasks in this project" 
          />
        </MobileTabsContent>
        
        <MobileTabsContent value="inprogress">
          <TaskList 
            tasks={inProgressTasks} 
            onEdit={onEdit} 
            onNewTask={() => {}} // Empty function since Add Task is handled in the header
            onStatusChange={onStatusChange} 
            emptyMessage="No tasks in progress in this project" 
          />
        </MobileTabsContent>
        
        <MobileTabsContent value="completed">
          <TaskList 
            tasks={completedTasks} 
            onEdit={onEdit} 
            onNewTask={() => {}} // Empty function since Add Task is handled in the header
            onStatusChange={onStatusChange} 
            emptyMessage="No completed tasks in this project" 
          />
        </MobileTabsContent>
      </MobileTabs>
    </div>
  );
};

export default ProjectTasksTabs;

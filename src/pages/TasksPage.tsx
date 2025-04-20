
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import TaskCard from '@/components/TaskCard';
import { Task } from '@/types';
import { Plus, Filter } from 'lucide-react';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import TaskCommentsDialog from '@/components/TaskCommentsDialog';

const TasksPage = () => {
  const { tasks } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = useState('deadline');
  const isMobile = useIsMobile();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showComments, setShowComments] = useState(false);
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };
  
  const handleViewComments = (task: Task) => {
    setSelectedTask(task);
    setShowComments(true);
  };
  
  // Filter tasks by status
  const todoTasks = tasks.filter((task) => task.status === 'To Do');
  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress');
  const pendingTasks = tasks.filter((task) => task.status === 'Pending');
  const completedTasks = tasks.filter((task) => task.status === 'Completed');
  
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
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
  };
  
  const sortedTodo = sortTasks(todoTasks);
  const sortedInProgress = sortTasks(inProgressTasks);
  const sortedPending = sortTasks(pendingTasks);
  const sortedCompleted = sortTasks(completedTasks);
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="deadline">Deadline</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created">Creation Date</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => {
            setEditingTask(undefined);
            setIsCreateTaskOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        </div>
      </div>
      
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
          {sortedTodo.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTodo.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-card p-6 rounded-lg border text-center">
              <p className="text-gray-500 dark:text-gray-300">No to-do tasks</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => {
                  setEditingTask(undefined);
                  setIsCreateTaskOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="inprogress">
          {sortedInProgress.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedInProgress.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border text-center">
              <p className="text-gray-500">No in-progress tasks</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {sortedPending.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPending.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border text-center">
              <p className="text-gray-500">No pending tasks</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {sortedCompleted.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCompleted.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border text-center">
              <p className="text-gray-500">No completed tasks</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
      />
      
      <TaskCommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        task={selectedTask}
      />
    </div>
  );
};

export default TasksPage;

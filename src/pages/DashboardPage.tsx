
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, Search, ArrowRight, Filter } from 'lucide-react';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const statusGroups = {
    'To Do': tasks.filter(task => task.status === 'To Do'),
    'In Progress': tasks.filter(task => task.status === 'In Progress'),
    'Pending': tasks.filter(task => task.status === 'Pending'),
    'Completed': tasks.filter(task => task.status === 'Completed')
  };

  const handleCreateTask = (project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-10 w-full md:w-[400px]"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={() => handleCreateTask()} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Task Progress */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Task Progress</h3>
            <div className="text-2xl font-bold">{completionRate}%</div>
          </div>
          <Progress value={completionRate} className="h-2 mb-2" />
          <p className="text-sm text-gray-500">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>

        {/* Active Tasks */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Active Tasks</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="mt-2 text-3xl font-bold">
            {statusGroups['In Progress'].length}
          </div>
          <p className="text-sm text-gray-500">Tasks in progress</p>
        </div>

        {/* Recent Projects */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Projects</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="mt-2 text-3xl font-bold">
            {projects.length}
          </div>
          <p className="text-sm text-gray-500">Active projects</p>
        </div>
      </div>

      {/* Task Status Groups */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(statusGroups).map(([status, tasks]) => (
          <div key={status} className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{status}</h3>
              <span className="text-sm px-2 py-1 bg-gray-100 rounded-full">
                {tasks.length}
              </span>
            </div>
            <div className="space-y-4">
              {tasks.slice(0, 3).map(task => (
                <div 
                  key={task.id} 
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                >
                  <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-gray-500">
                    Due {format(new Date(task.deadline), 'MMM dd')}
                  </p>
                </div>
              ))}
              {tasks.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full text-primary">
                  View {tasks.length - 3} more
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={selectedProject?.id}
      />
    </div>
  );
};

export default DashboardPage;

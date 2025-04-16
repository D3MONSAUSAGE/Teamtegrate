
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import DailyScoreCard from '@/components/DailyScoreCard';
import TaskCard from '@/components/TaskCard';
import { useTask } from '@/contexts/TaskContext';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, Users, ChevronRight } from 'lucide-react';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import { format } from 'date-fns';
import ProjectCard from '@/components/ProjectCard';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects, dailyScore } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Filter tasks for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  // Filter upcoming tasks (next 7 days excluding today)
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > today && taskDate <= nextWeek;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  
  // Get recent projects (for managers)
  const recentProjects = projects.slice(0, 3);
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col gap-8">
        {/* Welcome and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-gray-600">
              {format(new Date(), "EEEE, MMMM d")} · Here's your daily overview
            </p>
          </div>
          <Button onClick={() => {
            setEditingTask(undefined);
            setIsCreateTaskOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        </div>
        
        {/* Daily Score and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DailyScoreCard score={dailyScore} />
          
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium mb-2">Today's Tasks</h3>
              <div className="text-3xl font-bold">{todaysTasks.length}</div>
              <div className="text-sm text-gray-500">
                {todaysTasks.filter(task => task.status === 'Completed').length} completed
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium mb-2">Upcoming Tasks</h3>
              <div className="text-3xl font-bold">{upcomingTasks.length}</div>
              <div className="text-sm text-gray-500">Next 7 days</div>
            </div>
          </div>
        </div>
        
        {/* Today's Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Today's Tasks</h2>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="text-primary">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {todaysTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border text-center">
              <p className="text-gray-500">No tasks scheduled for today</p>
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
        </div>
        
        {/* Upcoming Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Tasks</h2>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="text-primary">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {upcomingTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingTasks.slice(0, 3).map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border text-center">
              <p className="text-gray-500">No upcoming tasks for the next 7 days</p>
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
        </div>
        
        {/* Projects (Only for managers) */}
        {user?.role === 'manager' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Link to="/projects">
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            {recentProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onViewTasks={() => {}} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg border text-center">
                <p className="text-gray-500">No projects created yet</p>
                <Link to="/projects">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" /> Create Project
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Team Section (Only for managers) */}
        {user?.role === 'manager' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Team Management</h2>
              <Link to="/team">
                <Button variant="ghost" size="sm" className="text-primary">
                  View team <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg border flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Manage Your Team</h3>
                <p className="text-gray-500">Assign tasks to team members and track their progress</p>
              </div>
              <Link to="/team">
                <Button className="gap-2">
                  <Users className="h-4 w-4" /> Team Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
      />
    </div>
  );
};

export default DashboardPage;

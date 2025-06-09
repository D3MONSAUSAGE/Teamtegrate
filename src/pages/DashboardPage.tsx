
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, Sparkles } from 'lucide-react';
import CreateTaskDialogWithAI from '@/components/CreateTaskDialogWithAI';
import { format } from 'date-fns';
import EnhancedTasksSummary from '@/components/dashboard/EnhancedTasksSummary';
import EnhancedWelcomeHeader from '@/components/dashboard/EnhancedWelcomeHeader';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';
import TimeTracking from '@/components/dashboard/TimeTracking';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects, dailyScore, refreshProjects } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const isMobile = useIsMobile();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > today && taskDate <= nextWeek;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  
  const recentProjects = projects.slice(0, 3);
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  const handleCreateTask = (project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  };

  const handleTaskDialogComplete = () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
    setSelectedProject(null);
  };

  const handleViewTasks = (project: Project) => {
    console.log("View tasks for project:", project.title);
  };
  
  return (
    <div className="space-y-8 no-scrollbar">
      {/* Enhanced Welcome Header */}
      <div className="animate-fade-in">
        <EnhancedWelcomeHeader 
          userName={user?.name}
          onCreateTask={() => handleCreateTask()}
        />
      </div>
      
      {/* Enhanced Quick Stats Summary */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <EnhancedTasksSummary 
          dailyScore={dailyScore}
          todaysTasks={todaysTasks}
          upcomingTasks={upcomingTasks}
        />
      </div>

      {/* Time Tracking Section */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <TimeTracking />
      </div>

      {/* Analytics Overview */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <AnalyticsSection 
          tasks={tasks} 
          projects={projects}
        />
      </div>
      
      {/* Tasks Sections */}
      <div className="space-y-8">
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <DailyTasksSection 
            tasks={todaysTasks}
            onCreateTask={() => handleCreateTask()}
            onEditTask={handleEditTask}
          />
        </div>
        
        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <UpcomingTasksSection 
            tasks={upcomingTasks}
            onCreateTask={() => handleCreateTask()}
            onEditTask={handleEditTask}
          />
        </div>
      </div>
      
      {/* Manager-only sections */}
      {user?.role === 'manager' && (
        <div className="space-y-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <RecentProjects 
              projects={recentProjects}
              onViewTasks={handleViewTasks}
              onCreateTask={handleCreateTask}
              onRefresh={refreshProjects}
            />
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <TeamManagement />
          </div>
        </div>
      )}
      
      <CreateTaskDialogWithAI 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={selectedProject?.id}
        onTaskComplete={handleTaskDialogComplete}
      />
    </div>
  );
};

export default DashboardPage;

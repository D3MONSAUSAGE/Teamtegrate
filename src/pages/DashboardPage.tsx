
import React from 'react';
import { Capacitor } from '@capacitor/core';
import MobileDashboardPage from './MobileDashboardPage';
import CleanDashboardHeader from '@/components/dashboard/CleanDashboardHeader';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import TaskSections from '@/components/dashboard/TaskSections';
import AndroidAppBanner from '@/components/dashboard/AndroidAppBanner';
import { useTask } from '@/contexts/task/TaskContext';
import { toast } from 'sonner';

const DashboardPage = () => {
  const { createTask } = useTask();
  const isMobile = Capacitor.isNativePlatform() || window.innerWidth < 768;

  // Return mobile version for mobile devices
  if (isMobile) {
    return <MobileDashboardPage />;
  }

  const handleNewTask = async () => {
    try {
      const newTask = {
        title: 'New Task',
        description: '',
        priority: 'Medium' as const,
        status: 'To Do' as const,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: '',
        assignedToName: '',
        estimatedHours: 1,
        tags: [],
        comments: [],
        projectId: null,
        createdBy: '',
        createdByName: '',
        organizationId: ''
      };
      
      await createTask(newTask);
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/3 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full px-2 sm:px-4 lg:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <CleanDashboardHeader onCreateTask={handleNewTask} />
        </div>

        {/* Stats Cards */}
        <div className="animate-fade-in delay-100">
          <DashboardStatsCards />
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in delay-200">
          <QuickActionsPanel />
        </div>

        {/* Task Sections */}
        <div className="animate-fade-in delay-300">
          <TaskSections />
        </div>

        {/* Android App Banner */}
        <div className="animate-fade-in delay-400">
          <AndroidAppBanner />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

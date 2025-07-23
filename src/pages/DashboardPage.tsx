
import React from 'react';
import { Capacitor } from '@capacitor/core';
import MobileDashboardPage from './MobileDashboardPage';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import { useTask } from '@/contexts/task/TaskContext';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { toast } from 'sonner';

const DashboardPage = () => {
  const { createTask } = useTask();
  const { user } = useAuth();
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
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userId: user?.id || '',
        projectId: null,
        tags: [],
        comments: [],
        organizationId: user?.organizationId || ''
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in delay-200">
          <QuickActionsPanel onCreateTask={handleNewTask} userRole={user?.role || 'user'} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

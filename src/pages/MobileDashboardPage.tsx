
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/mobile/MobileLayout';
import MobileDashboardHeader from '@/components/mobile/MobileDashboardHeader';
import MobileStatsCards from '@/components/mobile/MobileStatsCards';
import MobileQuickActions from '@/components/mobile/MobileQuickActions';
import MobileTodaysTasksSection from '@/components/mobile/MobileTodaysTasksSection';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import { useTask } from '@/contexts/task/TaskContext';
import { Task } from '@/types';
import { Capacitor } from '@capacitor/core';

const MobileDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshTasks } = useTask();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } finally {
      setRefreshing(false);
    }
  };

  const handleNewTask = () => {
    navigate('/tasks?action=new');
  };

  const handleTaskPress = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleViewAllTasks = () => {
    navigate('/tasks');
  };

  const handleCalendar = () => {
    navigate('/calendar');
  };

  const handleTimer = () => {
    navigate('/time-tracking');
  };

  const handleReports = () => {
    navigate('/reports');
  };

  return (
    <MobileLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
          {/* Header */}
          <MobileDashboardHeader />
          
          {/* Content */}
          <div className="space-y-6 pb-6">
            {/* Stats Cards */}
            <div className="pt-4">
              <MobileStatsCards />
            </div>

            {/* Quick Actions */}
            <MobileQuickActions
              onNewTask={handleNewTask}
              onCalendar={handleCalendar}
              onTimer={handleTimer}
              onReports={handleReports}
            />

            {/* Today's Tasks */}
            <MobileTodaysTasksSection
              onTaskPress={handleTaskPress}
              onViewAll={handleViewAllTasks}
            />
          </div>
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton
        onCreateTask={handleNewTask}
        onStartTimer={handleTimer}
      />
    </MobileLayout>
  );
};

export default MobileDashboardPage;

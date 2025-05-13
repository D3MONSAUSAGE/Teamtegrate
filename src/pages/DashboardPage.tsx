
import React from 'react';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import TasksSummary from '@/components/dashboard/TasksSummary';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';
import TimeTracking from '@/components/dashboard/TimeTracking';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DatabaseErrorAlert from '@/components/dashboard/DatabaseErrorAlert';
import useDashboardData from '@/hooks/dashboard/useDashboardData';

const DashboardPage = () => {
  const {
    user,
    tasks,
    projects,
    dailyScore,
    isLoading,
    isRefreshing,
    hasError,
    todaysTasks,
    upcomingTasks,
    recentProjects,
    editingTask,
    selectedProject,
    isCreateTaskOpen,
    handleRefreshData,
    handleEditTask,
    handleCreateTask,
    handleViewTasks,
    handleCreateTaskDialogChange,
  } = useDashboardData();
  
  return (
    <div className="p-2 md:p-6">
      <div className="flex flex-col gap-4 md:gap-8">
        <DashboardHeader
          userName={user?.name}
          onCreateTask={() => handleCreateTask()}
          onRefresh={handleRefreshData}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
        />
        
        <DatabaseErrorAlert hasError={hasError} />
        
        <TasksSummary 
          dailyScore={dailyScore}
          todaysTasks={todaysTasks}
          upcomingTasks={upcomingTasks}
          isLoading={isLoading}
        />

        <TimeTracking />

        <AnalyticsSection 
          tasks={tasks}
          projects={projects}
        />
        
        <DailyTasksSection 
          tasks={todaysTasks}
          onCreateTask={() => handleCreateTask()}
          onEditTask={handleEditTask}
          isLoading={isLoading}
        />
        
        <UpcomingTasksSection 
          tasks={upcomingTasks}
          onCreateTask={() => handleCreateTask()}
          onEditTask={handleEditTask}
          isLoading={isLoading}
        />
        
        {user?.role === 'manager' && (
          <>
            <RecentProjects 
              projects={recentProjects}
              onViewTasks={handleViewTasks}
              onCreateTask={handleCreateTask}
              onRefresh={handleRefreshData}
              isLoading={isLoading}
            />
            
            <TeamManagement />
          </>
        )}
      </div>
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={handleCreateTaskDialogChange}
        editingTask={editingTask}
        currentProjectId={selectedProject?.id}
      />
    </div>
  );
};

export default DashboardPage;

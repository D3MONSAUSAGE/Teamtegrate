import React from 'react';
import { Task, Project } from '@/types';
import CompactMetricsRow from './CompactMetricsRow';
import CompactCalendarWidget from './CompactCalendarWidget';
import CompactQuickClock from './CompactQuickClock';
import CompactTaskSummary from './CompactTaskSummary';
import CompactProjectProgress from './CompactProjectProgress';
import CompactQuickActions from './CompactQuickActions';

interface CompactDashboardLayoutProps {
  dailyScore: number;
  tasks: Task[];
  projects: Project[];
  userRole: string;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onCreateProject?: () => void;
}

const CompactDashboardLayout: React.FC<CompactDashboardLayoutProps> = ({
  dailyScore,
  tasks,
  projects,
  userRole,
  onCreateTask,
  onEditTask,
  onCreateProject
}) => {
  console.log('CompactDashboardLayout userRole:', userRole);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const overdueTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    const now = new Date();
    return taskDate < now && task.status !== 'Completed';
  });

  // Set up event listener for create task from quick actions
  React.useEffect(() => {
    const handleCreateTask = () => onCreateTask();
    window.addEventListener('create-task', handleCreateTask);
    return () => window.removeEventListener('create-task', handleCreateTask);
  }, [onCreateTask]);

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="animate-fade-in">
        <CompactMetricsRow 
          dailyScore={dailyScore}
          todaysTasks={todaysTasks}
          overdueTasks={overdueTasks}
        />
      </div>

      {/* Main Content Grid - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in delay-100">
        {/* Left Column - 30% */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mini Calendar */}
          <CompactCalendarWidget 
            tasks={tasks}
            onCreateTask={onCreateTask}
          />
          
          {/* Quick Clock Controls */}
          <CompactQuickClock />
        </div>

        {/* Center Column - 40% */}
        <div className="lg:col-span-5 space-y-6">
          {/* Task Summary Dashboard */}
          <CompactTaskSummary 
            tasks={tasks}
            onCreateTask={onCreateTask}
            onEditTask={onEditTask}
          />
          
          {/* Project Progress - Only for managers */}
          {userRole === 'manager' && projects.length > 0 && (
            <CompactProjectProgress 
              projects={projects}
              tasks={tasks}
              onCreateProject={onCreateProject}
            />
          )}
        </div>

        {/* Right Column - 30% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Actions Panel */}
          <CompactQuickActions userRole={userRole} />
          
          {/* Today's Focus - Next 3 priority tasks */}
          <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              🎯 Today's Focus
            </h3>
            <div className="space-y-2">
              {todaysTasks
                .filter(task => task.status !== 'Completed')
                .sort((a, b) => {
                  // Sort by priority (High > Medium > Low)
                  const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                  return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                         (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
                })
                .slice(0, 3)
                .map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-background/50 cursor-pointer text-sm"
                    onClick={() => onEditTask(task)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === 'High' ? 'bg-red-500' :
                      task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="truncate flex-1">{task.title}</span>
                  </div>
                ))}
              {todaysTasks.filter(task => task.status !== 'Completed').length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  ✅ All tasks completed!
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Meetings Placeholder */}
          <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              📅 Upcoming Meetings
            </h3>
            <div className="text-center py-4 text-sm text-muted-foreground">
              <div className="text-2xl mb-2">📊</div>
              <p>Calendar integration</p>
              <p className="text-xs">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactDashboardLayout;
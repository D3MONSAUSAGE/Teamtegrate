
import React from 'react';
import { Clock, TrendingUp, AlertTriangle, Users, Calendar } from 'lucide-react';

interface CalendarStatsProps {
  todayTasksCount: number;
  upcomingTasksCount: number;
  overdueTasksCount: number;
  upcomingMeetingsCount?: number;
  pendingInvitationsCount?: number;
}

const CalendarStats: React.FC<CalendarStatsProps> = ({
  todayTasksCount,
  upcomingTasksCount,
  overdueTasksCount,
  upcomingMeetingsCount = 0,
  pendingInvitationsCount = 0
}) => {
  const hasOverdue = overdueTasksCount > 0;
  const hasPendingInvitations = pendingInvitationsCount > 0;
  const gridCols = hasOverdue && hasPendingInvitations ? 'md:grid-cols-5' : 
                   hasOverdue || hasPendingInvitations ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
      {/* Today's Tasks */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-blue-600/10 border border-blue-200/30 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 group-hover:scale-110 transition-transform">
              {todayTasksCount}
            </div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Today's Tasks</div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Tasks */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-emerald-600/10 border border-emerald-200/30 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
            <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 group-hover:scale-110 transition-transform">
              {upcomingTasksCount}
            </div>
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Upcoming Tasks</div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Meetings */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-purple-600/10 border border-purple-200/30 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20">
            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 group-hover:scale-110 transition-transform">
              {upcomingMeetingsCount}
            </div>
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Upcoming Meetings</div>
          </div>
        </div>
      </div>

      {/* Pending Invitations - Only show if there are pending invitations */}
      {pendingInvitationsCount > 0 && (
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-amber-600/10 border border-amber-200/30 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Users className="h-6 w-6 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-300 group-hover:scale-110 transition-transform">
                {pendingInvitationsCount}
              </div>
              <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending Invitations</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Overdue Tasks - Only show if there are overdue tasks */}
      {overdueTasksCount > 0 && (
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-rose-600/10 border border-rose-200/30 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/20">
              <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400 animate-bounce" />
            </div>
            <div>
              <div className="text-3xl font-bold text-rose-700 dark:text-rose-300 group-hover:scale-110 transition-transform">
                {overdueTasksCount}
              </div>
              <div className="text-sm font-medium text-rose-600 dark:text-rose-400">Overdue Tasks</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarStats;

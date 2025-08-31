import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from "react-day-picker";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { hasRoleAccess } from '@/contexts/auth';

// Personal Dashboard Components
import { PersonalDashboard } from '@/components/reports/personal/PersonalDashboard';
import { UserSearchPanel } from '@/components/reports/personal/UserSearchPanel';
import { ExportPanel } from '@/components/reports/personal/ExportPanel';
import { TimeRangeSelector } from '@/components/reports/personal/TimeRangeSelector';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  
  // User-centric state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('7 days'); // Default to weekly
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Initialize with current user
  React.useEffect(() => {
    if (user && !selectedUserId) {
      setSelectedUserId(user.id);
      setSelectedUserName(user.name);
    }
  }, [user, selectedUserId]);
  
  // Check if current user has manager+ access for search functionality
  const canSearchUsers = user && hasRoleAccess(user.role, 'manager');
  const isViewingCurrentUser = selectedUserId === user?.id;
  
  // Handlers
  const handleUserSelect = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  };
  
  const handleBackToPersonal = () => {
    if (user) {
      setSelectedUserId(user.id);
      setSelectedUserName(user.name);
    }
  };
  
  const handleExport = async (exportType: 'personal-overview' | 'personal-tasks' | 'personal-performance' | 'personal-projects') => {
    try {
      const { downloadCSV } = await import('@/utils/exportUtils');
      
      const targetUserId = selectedUserId;
      const targetUserName = selectedUserName;
      
      // Generate filename
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const userStr = isViewingCurrentUser ? 'my' : targetUserName.toLowerCase().replace(/\s+/g, '-');
      const timeStr = timeRange === '7 days' ? 'weekly' : timeRange === '30 days' ? 'monthly' : 'custom';
      
      let exportData;
      
      switch (exportType) {
        case 'personal-overview':
          exportData = {
            filename: `${userStr}-overview-${timeStr}-${dateStr}.csv`,
            headers: ['Metric', 'Value', 'Period'],
            rows: [
              ['User', targetUserName, timeRange],
              ['Report Type', 'Personal Overview', ''],
              ['Generated At', format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ''],
              ['', '', ''], // Empty row for separation
              // Add actual metrics here based on available data
            ]
          };
          break;
          
        case 'personal-tasks':
          exportData = {
            filename: `${userStr}-tasks-${timeStr}-${dateStr}.csv`,
            headers: ['User', 'Report Type', 'Period'],
            rows: [
              [targetUserName, 'Task Details', timeRange]
            ]
          };
          break;
          
        case 'personal-performance':
          exportData = {
            filename: `${userStr}-performance-${timeStr}-${dateStr}.csv`,
            headers: ['User', 'Report Type', 'Period'],
            rows: [
              [targetUserName, 'Performance Metrics', timeRange]
            ]
          };
          break;
          
        case 'personal-projects':
          exportData = {
            filename: `${userStr}-projects-${timeStr}-${dateStr}.csv`,
            headers: ['User', 'Report Type', 'Period'],
            rows: [
              [targetUserName, 'Project Contributions', timeRange]
            ]
          };
          break;
          
        default:
          throw new Error('Unknown export type');
      }
      
      downloadCSV(exportData);
      toast.success(`${isViewingCurrentUser ? 'Your' : `${targetUserName}'s`} report exported successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };

  // Show loading if user data isn't ready
  if (!user || !selectedUserId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Loading your dashboard...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Time Range Controls */}
      <TimeRangeSelector
        timeRange={timeRange}
        dateRange={dateRange}
        onTimeRangeChange={setTimeRange}
        onDateRangeChange={setDateRange}
      />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Dashboard - Takes most space */}
        <div className="lg:col-span-3">
          <PersonalDashboard
            userId={selectedUserId}
            userName={selectedUserName}
            timeRange={timeRange}
            dateRange={dateRange}
          />
        </div>

        {/* Sidebar - Controls and Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Search Panel (Managers+ only) */}
          {canSearchUsers && (
            <>
              <UserSearchPanel
                selectedUserId={selectedUserId}
                selectedUserName={selectedUserName}
                onUserSelect={handleUserSelect}
                onBackToPersonal={handleBackToPersonal}
              />
              <Separator />
            </>
          )}

          {/* Export Panel */}
          <ExportPanel
            selectedUserId={selectedUserId}
            selectedUserName={selectedUserName}
            timeRange={timeRange}
            dateRange={dateRange}
            onExport={handleExport}
            isCurrentUser={isViewingCurrentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReportFilters } from '@/hooks/useReportFilters';
import { ComprehensiveReportsPanel } from '@/components/reports/ComprehensiveReportsPanel';
import { ReportFilters } from '@/components/finance/reports/ReportFilters';
import { calculateDateRange } from '@/utils/dateRangeUtils';
import { BarChart3, Calendar, Users, FolderOpen } from 'lucide-react';
import { downloadCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  
  // Use centralized report filters
  const {
    timeRange,
    dateRange,
    selectedTeamId,
    selectedUserId,
    calculatedDateRange,
    setTimeRange,
    setDateRange,
    setSelectedTeamId,
    setSelectedUserId
  } = useReportFilters();

  const handleRefresh = () => {
    toast.success('Reports refreshed!');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse h-12 w-12 bg-muted rounded-full mx-auto" />
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Reports</h1>
            <p className="text-muted-foreground">Comprehensive insights into task completion and team performance</p>
          </div>
        </div>

        {/* User Selection for Reports */}
        <ReportFilters
          timeRange={timeRange}
          dateRange={dateRange}
          selectedTeamId={selectedTeamId}
          selectedUserId={selectedUserId}
          onTimeRangeChange={setTimeRange}
          onDateRangeChange={setDateRange}
          onTeamChange={setSelectedTeamId}
          onUserChange={setSelectedUserId}
          calculatedDateRange={calculatedDateRange}
        />

        {/* User-focused Reports Panel */}
        <ComprehensiveReportsPanel
          userId={selectedUserId || user.id}
          userName={selectedUserId ? "Selected User" : user.name || "Current User"}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </div>
    </div>
  );
};

export default ReportsPage;
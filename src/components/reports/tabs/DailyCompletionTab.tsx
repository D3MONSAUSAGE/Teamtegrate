import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Target, TrendingUp, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTaskReports } from '@/hooks/useTaskReports';
import { DailyTaskDetailView, DailyDetailData } from '@/components/reports/weekly/DailyTaskDetailView';
import { toast } from 'sonner';

interface DailyCompletionTabProps {
  userId: string;
  userName: string;
  selectedDate: Date;
}

export const DailyCompletionTab: React.FC<DailyCompletionTabProps> = ({
  userId,
  userName,
  selectedDate
}) => {
  const [dailyDetailData, setDailyDetailData] = useState<DailyDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Use the task reports hook for single day data
  const { getDailyTaskDetails } = useTaskReports({
    timeRange: 'custom', // Use custom for single date queries
    userId,
  });

  // Load data when date or user changes, but not when getDailyTaskDetails changes
  React.useEffect(() => {
    const loadDailyData = async () => {
      if (!selectedDate) return;
      
      setDetailLoading(true);
      setDailyDetailData(null);
      
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const details = await getDailyTaskDetails(dateStr);
        setDailyDetailData(details);
      } catch (error) {
        console.error('Failed to load daily details:', error);
        toast.error('Failed to load daily task details');
      } finally {
        setDetailLoading(false);
      }
    };

    loadDailyData();
  }, [selectedDate, userId]); // Remove getDailyTaskDetails from dependencies

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Task Report
          </CardTitle>
          <p className="text-muted-foreground">
            {userName} • {format(selectedDate, 'EEEE, MMMM do, yyyy')}
          </p>
        </CardHeader>
      </Card>

      {/* Quick Summary Cards */}
      {dailyDetailData && !detailLoading && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{dailyDetailData.completed_tasks.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-2xl font-bold text-blue-600">{dailyDetailData.created_tasks.length}</p>
                </div>
                <Plus className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned</p>
                  <p className="text-2xl font-bold text-purple-600">{dailyDetailData.assigned_tasks.length}</p>
                </div>
                <Plus className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-orange-600">{dailyDetailData.overdue_tasks.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Score</p>
                  <p className="text-2xl font-bold text-primary">{dailyDetailData.completion_score}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Daily View */}
      <DailyTaskDetailView 
        data={dailyDetailData}
        isLoading={detailLoading}
        selectedDate={format(selectedDate, 'yyyy-MM-dd')}
      />
    </div>
  );
};
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Download, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Users, 
  Target,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DailyCompletionTab } from '@/components/reports/tabs/DailyCompletionTab';
import { WeeklyOverviewTab } from '@/components/reports/tabs/WeeklyOverviewTab';

interface ComprehensiveReportsPanelProps {
  userId: string;
  userName: string;
  timeRange: string;
  dateRange?: DateRange;
}

export const ComprehensiveReportsPanel: React.FC<ComprehensiveReportsPanelProps> = ({
  userId,
  userName,
  timeRange,
  dateRange,
}) => {
  return (
    <div className="space-y-6">
      {/* Main Tabs */}
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Completion</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyCompletionTab 
            userId={userId}
            userName={userName}
          />
        </TabsContent>

        <TabsContent value="weekly">
          <WeeklyOverviewTab 
            userId={userId}
            userName={userName}
            timeRange={timeRange}
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
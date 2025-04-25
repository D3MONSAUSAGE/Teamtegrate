
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectReports from '@/components/reports/ProjectReports';
import TeamReports from '@/components/reports/TeamReports';
import TaskReports from '@/components/reports/TaskReports';
import TeamTimeReports from '@/components/reports/TeamTimeReports';
import DailyPerformanceReport from '@/components/reports/DailyPerformanceReport';
import { Timeline } from "@/components/ui/timeline";
import TimelinePage from './TimelinePage';
import { useIsMobile } from '@/hooks/use-mobile';

const ReportsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("performance");
  
  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full flex justify-between md:justify-start md:w-auto overflow-x-auto">
          <TabsTrigger value="performance" className="flex-1 md:flex-none">Performance</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 md:flex-none">Tasks</TabsTrigger>
          <TabsTrigger value="projects" className="flex-1 md:flex-none">Projects</TabsTrigger>
          <TabsTrigger value="team" className="flex-1 md:flex-none">Team</TabsTrigger>
          <TabsTrigger value="time" className="flex-1 md:flex-none">Time</TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1 md:flex-none">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="space-y-4">
          <DailyPerformanceReport />
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <TaskReports />
        </TabsContent>
        <TabsContent value="projects" className="space-y-4">
          <ProjectReports />
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <TeamReports />
        </TabsContent>
        <TabsContent value="time" className="space-y-4">
          <TeamTimeReports />
        </TabsContent>
        <TabsContent value="timeline" className="space-y-4">
          <TimelinePage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;

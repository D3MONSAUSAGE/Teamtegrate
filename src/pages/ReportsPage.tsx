
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectReports from '@/components/reports/ProjectReports';
import TeamReports from '@/components/reports/TeamReports';
import TaskReports from '@/components/reports/TaskReports';
import TeamTimeReports from '@/components/reports/TeamTimeReports';
import WeeklyPerformanceReport from '@/components/reports/WeeklyPerformanceReport';
import { Timeline } from "@/components/ui/timeline";
import TimelinePage from './TimelinePage';
import { useIsMobile } from '@/hooks/use-mobile';

const ReportsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("performance");
  
  return (
    <div className="space-y-6 px-2 sm:px-4 pb-10">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative w-full overflow-hidden">
          <TabsList className="relative w-full flex gap-1 overflow-x-auto scrollbar-none before:absolute before:right-0 before:top-0 before:bottom-0 before:w-4 before:bg-gradient-to-l before:from-background before:z-10 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-background after:z-10">
            <div className="flex gap-1 px-4 py-1 min-w-full justify-between md:justify-start">
              <TabsTrigger 
                value="performance" 
                className="flex-1 md:flex-none px-3 min-w-[100px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger 
                value="tasks" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Projects
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Team
              </TabsTrigger>
              <TabsTrigger 
                value="time" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Time
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Timeline
              </TabsTrigger>
            </div>
          </TabsList>
        </div>

        <TabsContent value="performance" className="space-y-4">
          <WeeklyPerformanceReport />
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


import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectReports from '@/components/reports/ProjectReports';
import TeamReports from '@/components/reports/TeamReports';
import TaskReports from '@/components/reports/TaskReports';

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-4">
          <TaskReports />
        </TabsContent>
        <TabsContent value="projects" className="space-y-4">
          <ProjectReports />
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <TeamReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;

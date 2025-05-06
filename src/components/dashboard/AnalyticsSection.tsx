
import React from 'react';
import { Task, Project, TaskStatus } from '@/types';
import CompletionRateChart from './analytics/CompletionRateChart';
import TeamPerformanceChart from './analytics/TeamPerformanceChart';
import ProjectProgressChart from './analytics/ProjectProgressChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from '@/hooks/use-mobile';

interface AnalyticsSectionProps {
  tasks: Task[];
  projects: Project[];
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ tasks, projects }) => {
  const isMobile = useIsMobile();
  
  return (
    <section className="mt-2">
      <h2 className="text-lg font-semibold mb-4">Analytics & Performance</h2>
      
      {isMobile ? (
        <Tabs defaultValue="completion">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="completion">Completion</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          
          <TabsContent value="completion">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Task Completion Rate</CardTitle>
                <CardDescription>Your task completion trends over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <CompletionRateChart tasks={tasks} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Team Performance</CardTitle>
                <CardDescription>Task completion by team members</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <TeamPerformanceChart tasks={tasks} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="projects">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Project Progress</CardTitle>
                <CardDescription>Status of tasks across projects</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ProjectProgressChart projects={projects} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Task Completion Rate</CardTitle>
              <CardDescription>Your task completion trends over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <CompletionRateChart tasks={tasks} />
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Team Performance</CardTitle>
              <CardDescription>Task completion by team members</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <TeamPerformanceChart tasks={tasks} />
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Project Progress</CardTitle>
              <CardDescription>Status of tasks across projects</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ProjectProgressChart projects={projects} />
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
};

export default AnalyticsSection;

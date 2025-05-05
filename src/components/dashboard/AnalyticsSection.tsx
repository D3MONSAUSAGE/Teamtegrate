
import React from 'react';
import { Task, Project } from '@/types';
import CompletionRateChart from './analytics/CompletionRateChart';
import TeamPerformanceChart from './analytics/TeamPerformanceChart';
import ProjectProgressChart from './analytics/ProjectProgressChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from '@/hooks/use-mobile';
import { PieChart, BarChartIcon, LineChart } from 'lucide-react'; 

interface AnalyticsSectionProps {
  tasks: Task[];
  projects: Project[];
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ tasks, projects }) => {
  const isMobile = useIsMobile();
  
  // Make sure each project has its tasks properly assigned
  const projectsWithTasks = React.useMemo(() => {
    return projects.map(project => ({
      ...project,
      tasks: tasks.filter(task => task.projectId === project.id)
    }));
  }, [projects, tasks]);
  
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Analytics & Performance</h2>
      
      {isMobile ? (
        <Tabs defaultValue="completion">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="completion" className="flex items-center gap-1">
              <LineChart className="h-3.5 w-3.5" />
              <span>Completion</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-1">
              <PieChart className="h-3.5 w-3.5" />
              <span>Team</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-1">
              <BarChartIcon className="h-3.5 w-3.5" />
              <span>Projects</span>
            </TabsTrigger>
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
                <ProjectProgressChart projects={projectsWithTasks} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-md">Task Completion Rate</CardTitle>
              </div>
              <CardDescription>Your task completion trends over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <CompletionRateChart tasks={tasks} />
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-md">Team Performance</CardTitle>
              </div>
              <CardDescription>Task completion by team members</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <TeamPerformanceChart tasks={tasks} />
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-md">Project Progress</CardTitle>
              </div>
              <CardDescription>Status of tasks across projects</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ProjectProgressChart projects={projectsWithTasks} />
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
};

export default AnalyticsSection;

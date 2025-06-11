import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from '@/types'; // Removed @/types/flat import

interface ProjectProgressChartProps {
  projects: Project[];
}

const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({ projects }) => {
  // Calculate progress for each project based on completion status
  const projectsWithProgress = projects.map(project => {
    let progress = 0;
    
    // Simple progress calculation based on status
    switch (project.status) {
      case 'Completed':
        progress = 100;
        break;
      case 'In Progress':
        progress = 50; // Default for in-progress projects
        break;
      default:
        progress = 0;
    }
    
    return { ...project, progress };
  });

  const averageProgress = projectsWithProgress.length > 0
    ? Math.round(projectsWithProgress.reduce((sum, p) => sum + p.progress, 0) / projectsWithProgress.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Project Progress
        </CardTitle>
        <CardDescription>
          Overall progress across all your projects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{averageProgress}%</div>
          <p className="text-sm text-muted-foreground">Average Progress</p>
        </div>
        
        <div className="space-y-3">
          {projectsWithProgress.slice(0, 5).map((project) => (
            <div key={project.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium truncate">{project.title}</span>
                <span className="text-muted-foreground">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          ))}
        </div>
        
        {projects.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            +{projects.length - 5} more projects
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectProgressChart;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus } from 'lucide-react';

interface ProjectsOverviewProps {
  projects?: any[];
}

const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({ projects = [] }) => {
  const mockProjects = [
    {
      id: 1,
      name: "Mobile App Redesign",
      status: "In Progress",
      progress: 75,
      dueDate: "2024-02-15"
    },
    {
      id: 2,
      name: "Website Optimization",
      status: "Planning",
      progress: 25,
      dueDate: "2024-03-01"
    },
    {
      id: 3,
      name: "User Research",
      status: "Completed",
      progress: 100,
      dueDate: "2024-01-30"
    }
  ];

  const displayProjects = projects.length > 0 ? projects : mockProjects;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Projects</CardTitle>
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayProjects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between space-x-4 rounded-md border p-4"
          >
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {project.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Due: {project.dueDate}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={
                project.status === 'Completed' ? 'default' :
                project.status === 'In Progress' ? 'secondary' : 'outline'
              }>
                {project.status}
              </Badge>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {displayProjects.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No projects found. Create your first project to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsOverview;
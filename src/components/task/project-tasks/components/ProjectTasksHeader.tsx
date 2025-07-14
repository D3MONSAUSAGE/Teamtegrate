
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Calendar, Users } from 'lucide-react';
import { Project, User } from '@/types';
import ProjectStatusSelect from '@/components/ProjectStatusSelect';

interface ProjectTasksHeaderProps {
  project: Project;
  searchQuery: string;
  sortBy: string;
  progress: number;
  teamMembers: User[];
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onEditProject: () => void;
}

const ProjectTasksHeader: React.FC<ProjectTasksHeaderProps> = ({
  project,
  searchQuery,
  sortBy,
  progress,
  teamMembers,
  onSearchChange,
  onSortByChange,
  onEditProject
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">{project.title}</CardTitle>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ProjectStatusSelect project={project} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Project Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Due: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No deadline'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{teamMembers.length} team members</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{project.tasksCount || 0} tasks</Badge>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="created">Created Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTasksHeader;

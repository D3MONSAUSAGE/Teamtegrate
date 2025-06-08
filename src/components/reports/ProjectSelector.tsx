
import React from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectIds: string[];
  onProjectToggle: (projectId: string) => void;
  onRemoveProject: (projectId: string) => void;
  onClearAll: () => void;
  maxProjects?: number;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectIds,
  onProjectToggle,
  onRemoveProject,
  onClearAll,
  maxProjects = 5
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));
  
  const getCompletionRate = (project: Project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'Completed').length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };
  
  const isAtMaxLimit = selectedProjectIds.length >= maxProjects;
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Projects to Display</CardTitle>
          <Badge variant="secondary">
            {selectedProjectIds.length}/{maxProjects} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Projects Display */}
        {selectedProjects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Selected Projects:</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearAll}
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedProjects.map(project => (
                <div 
                  key={project.id}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  <span>{project.title}</span>
                  <span className="text-xs opacity-70">({getCompletionRate(project)}%)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    onClick={() => onRemoveProject(project.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Project List */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredProjects.map(project => {
            const isSelected = selectedProjectIds.includes(project.id);
            const completionRate = getCompletionRate(project);
            const canSelect = isSelected || !isAtMaxLimit;
            
            return (
              <div 
                key={project.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                } ${!canSelect ? 'opacity-50' : ''}`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => canSelect && onProjectToggle(project.id)}
                  disabled={!canSelect}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{project.title}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{completionRate}%</span>
                      <span>({project.tasks.length} tasks)</span>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {isAtMaxLimit && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Maximum of {maxProjects} projects can be displayed at once.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectSelector;

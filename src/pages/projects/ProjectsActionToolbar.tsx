
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus,
  SortAsc,
  Filter,
  Grid3X3,
  List,
  Users,
  BarChart3,
  Calendar,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from '@/types';

interface ProjectsActionToolbarProps {
  viewMode: 'compact' | 'detailed' | 'grid' | 'list';
  onViewModeChange: (mode: 'compact' | 'detailed' | 'grid' | 'list') => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  teamMembers: User[];
  selectedAssignee?: string;
  onAssigneeFilter: (assigneeId: string | undefined) => void;
  showCompleted: boolean;
  onToggleCompleted: () => void;
  onCreateProject: () => void;
  projectsCount: number;
}

const ProjectsActionToolbar: React.FC<ProjectsActionToolbarProps> = ({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  statusFilter,
  onStatusFilterChange,
  teamMembers,
  selectedAssignee,
  onAssigneeFilter,
  showCompleted,
  onToggleCompleted,
  onCreateProject,
  projectsCount
}) => {
  const getViewIcon = (mode: string) => {
    switch (mode) {
      case 'compact': return <Grid3X3 className="h-4 w-4" />;
      case 'detailed': return <List className="h-4 w-4" />;
      case 'grid': return <Grid3X3 className="h-4 w-4" />;
      case 'list': return <List className="h-4 w-4" />;
      default: return <Grid3X3 className="h-4 w-4" />;
    }
  };

  const activeFiltersCount = [
    statusFilter !== 'all' ? statusFilter : null,
    selectedAssignee,
    !showCompleted ? 'hideCompleted' : null
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl mb-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">
              {projectsCount} project{projectsCount !== 1 ? 's' : ''}
            </Badge>
            {activeFiltersCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created Date
                </div>
              </SelectItem>
              <SelectItem value="deadline">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Deadline
                </div>
              </SelectItem>
              <SelectItem value="status">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Status
                </div>
              </SelectItem>
              <SelectItem value="progress">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Progress
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Team Member Filter */}
        <Select value={selectedAssignee || 'all'} onValueChange={(value) => onAssigneeFilter(value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All team members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Team Members
              </div>
            </SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                    {member.name.substring(0, 1).toUpperCase()}
                  </div>
                  {member.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Toggle Controls */}
        <Button
          variant={showCompleted ? "default" : "outline"}
          size="sm"
          onClick={onToggleCompleted}
          className="gap-2"
        >
          {showCompleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Completed
        </Button>

        {/* View Mode Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {getViewIcon(viewMode)}
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewModeChange('compact')}>
              <Grid3X3 className="h-4 w-4 mr-2" />
              Compact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewModeChange('detailed')}>
              <List className="h-4 w-4 mr-2" />
              Detailed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewModeChange('grid')}>
              <Grid3X3 className="h-4 w-4 mr-2" />
              Grid View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewModeChange('list')}>
              <List className="h-4 w-4 mr-2" />
              List View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Create Project Button */}
        <Button onClick={onCreateProject} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
};

export default ProjectsActionToolbar;

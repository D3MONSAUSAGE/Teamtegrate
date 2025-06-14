
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
  Filter, 
  SortAsc, 
  SortDesc, 
  Users, 
  Calendar,
  Tag,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '@/types';

interface ViewControlsPanelProps {
  viewMode: 'compact' | 'detailed' | 'board' | 'list';
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  teamMembers: User[];
  selectedAssignee?: string;
  onAssigneeFilter: (assigneeId: string | undefined) => void;
  selectedPriority?: string;
  onPriorityFilter: (priority: string | undefined) => void;
  showCompleted: boolean;
  onToggleCompleted: () => void;
  showOverview: boolean;
  onToggleOverview: () => void;
}

const ViewControlsPanel: React.FC<ViewControlsPanelProps> = ({
  viewMode,
  sortBy,
  onSortByChange,
  teamMembers,
  selectedAssignee,
  onAssigneeFilter,
  selectedPriority,
  onPriorityFilter,
  showCompleted,
  onToggleCompleted,
  showOverview,
  onToggleOverview
}) => {
  const activeFiltersCount = [
    selectedAssignee,
    selectedPriority,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl mb-4">
      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <SortAsc className="h-4 w-4 text-muted-foreground" />
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Deadline
              </div>
            </SelectItem>
            <SelectItem value="priority">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Priority
              </div>
            </SelectItem>
            <SelectItem value="status">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Status
              </div>
            </SelectItem>
            <SelectItem value="created">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created Date
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Assignee Filter */}
      <Select value={selectedAssignee || 'all'} onValueChange={(value) => onAssigneeFilter(value === 'all' ? undefined : value)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All assignees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Assignees
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

      {/* Priority Filter */}
      <Select value={selectedPriority || 'all'} onValueChange={(value) => onPriorityFilter(value === 'all' ? undefined : value)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="High">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              High
            </div>
          </SelectItem>
          <SelectItem value="Medium">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Medium
            </div>
          </SelectItem>
          <SelectItem value="Low">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Low
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="h-6 w-px bg-border" />

      {/* View Toggle Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={showCompleted ? "default" : "outline"}
          size="sm"
          onClick={onToggleCompleted}
          className="gap-2"
        >
          {showCompleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Completed
        </Button>

        <Button
          variant={showOverview ? "default" : "outline"}
          size="sm"
          onClick={onToggleOverview}
          className="gap-2"
        >
          {showOverview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Overview
        </Button>
      </div>
    </div>
  );
};

export default ViewControlsPanel;

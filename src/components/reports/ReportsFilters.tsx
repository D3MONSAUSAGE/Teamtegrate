import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, RotateCcw, Download, Share2 } from 'lucide-react';
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface ReportsFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  selectedProjects: string[];
  onProjectsChange: (projects: string[]) => void;
  selectedMembers: string[];
  onMembersChange: (members: string[]) => void;
  availableProjects: Array<{ id: string; title: string }>;
  availableMembers: Array<{ id: string; name: string }>;
  onReset: () => void;
  onExport: () => void;
}

const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  timeRange,
  onTimeRangeChange,
  selectedProjects,
  onProjectsChange,
  selectedMembers,
  onMembersChange,
  availableProjects,
  availableMembers,
  onReset,
  onExport
}) => {
  const activeFiltersCount = [
    dateRange ? 1 : 0,
    selectedProjects.length,
    selectedMembers.length
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 days">Last 7 days</SelectItem>
                <SelectItem value="30 days">Last 30 days</SelectItem>
                <SelectItem value="90 days">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {timeRange === 'custom' && (
            <DatePickerWithRange
              date={dateRange}
              onDateChange={onDateRangeChange}
              className="w-auto"
            />
          )}

          {/* Project Filter */}
          <Select
            value={selectedProjects.length === 1 ? selectedProjects[0] : ""}
            onValueChange={(value) => {
              if (value === "all") {
                onProjectsChange([]);
              } else {
                onProjectsChange([value]);
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {availableProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Team Member Filter */}
          <Select
            value={selectedMembers.length === 1 ? selectedMembers[0] : ""}
            onValueChange={(value) => {
              if (value === "all") {
                onMembersChange([]);
              } else {
                onMembersChange([value]);
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Team Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Members</SelectItem>
              {availableMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  className="gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-1"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <Share2 className="w-3 h-3" />
              Share
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedProjects.length > 0 || selectedMembers.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {selectedProjects.map((projectId) => {
              const project = availableProjects.find(p => p.id === projectId);
              return project ? (
                <Badge key={projectId} variant="secondary" className="gap-1">
                  Project: {project.title}
                  <button
                    onClick={() => onProjectsChange(selectedProjects.filter(id => id !== projectId))}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ) : null;
            })}
            
            {selectedMembers.map((memberId) => {
              const member = availableMembers.find(m => m.id === memberId);
              return member ? (
                <Badge key={memberId} variant="secondary" className="gap-1">
                  Member: {member.name}
                  <button
                    onClick={() => onMembersChange(selectedMembers.filter(id => id !== memberId))}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportsFilters;
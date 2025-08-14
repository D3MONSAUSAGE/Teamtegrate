import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Filter, RotateCcw, Download, Share2, ChevronDown, User, FileText } from 'lucide-react';
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { getTimeRangeOptions, getExportTypeOptions } from '@/utils/exportUtils';
import type { ExportType } from '@/hooks/useEnhancedExport';

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
  onExport: (exportType: ExportType, selectedUser?: string) => void;
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
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<ExportType>('overview');
  const [selectedUserForExport, setSelectedUserForExport] = useState<string>('all');

  const activeFiltersCount = [
    dateRange ? 1 : 0,
    selectedProjects.length,
    selectedMembers.length
  ].reduce((sum, count) => sum + count, 0);

  const timeRangeOptions = getTimeRangeOptions();
  const exportTypeOptions = getExportTypeOptions();

  const handleProjectToggle = (projectId: string) => {
    if (selectedProjects.includes(projectId)) {
      onProjectsChange(selectedProjects.filter(id => id !== projectId));
    } else {
      onProjectsChange([...selectedProjects, projectId]);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      onMembersChange(selectedMembers.filter(id => id !== memberId));
    } else {
      onMembersChange([...selectedMembers, memberId]);
    }
  };

  const handleExportClick = () => {
    onExport(selectedExportType, selectedUserForExport === 'all' ? undefined : selectedUserForExport || undefined);
    setIsExportOpen(false);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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

          {/* Project Filter - Multi-select */}
          <Popover open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-48 justify-between"
              >
                <span className="truncate">
                  {selectedProjects.length === 0 
                    ? "All Projects" 
                    : selectedProjects.length === 1 
                      ? availableProjects.find(p => p.id === selectedProjects[0])?.title || "Projects"
                      : `${selectedProjects.length} Projects`
                  }
                </span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
              <div className="max-h-64 overflow-auto">
                <div className="p-2 border-b">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-projects"
                      checked={selectedProjects.length === 0}
                      onCheckedChange={() => onProjectsChange([])}
                    />
                    <label htmlFor="all-projects" className="text-sm font-medium">
                      All Projects
                    </label>
                  </div>
                </div>
                <div className="p-1">
                  {availableProjects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={() => handleProjectToggle(project.id)}
                      />
                      <label 
                        htmlFor={`project-${project.id}`} 
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {project.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Team Member Filter - Multi-select */}
          <Popover open={isMembersOpen} onOpenChange={setIsMembersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-48 justify-between"
              >
                <span className="truncate">
                  {selectedMembers.length === 0 
                    ? "All Team Members" 
                    : selectedMembers.length === 1 
                      ? availableMembers.find(m => m.id === selectedMembers[0])?.name || "Members"
                      : `${selectedMembers.length} Members`
                  }
                </span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
              <div className="max-h-64 overflow-auto">
                <div className="p-2 border-b">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-members"
                      checked={selectedMembers.length === 0}
                      onCheckedChange={() => onMembersChange([])}
                    />
                    <label htmlFor="all-members" className="text-sm font-medium">
                      All Team Members
                    </label>
                  </div>
                </div>
                <div className="p-1">
                  {availableMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => handleMemberToggle(member.id)}
                      />
                      <label 
                        htmlFor={`member-${member.id}`} 
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

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
            
            {/* Enhanced Export Button */}
            <Popover open={isExportOpen} onOpenChange={setIsExportOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <Download className="w-3 h-3" />
                  Export
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Export Type</label>
                    <Select value={selectedExportType} onValueChange={(value) => setSelectedExportType(value as ExportType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {exportTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      <User className="w-3 h-3 inline mr-1" />
                      Specific User (Optional)
                    </label>
                    <Select value={selectedUserForExport} onValueChange={setSelectedUserForExport}>
                      <SelectTrigger>
                        <SelectValue placeholder="All users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        {availableMembers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={handleExportClick} className="w-full gap-2">
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
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
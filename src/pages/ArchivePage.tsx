import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Search, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useArchivedTasks } from '@/hooks/useArchivedTasks';
import { useTaskArchive } from '@/hooks/useTaskArchive';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import type { ArchiveFilters } from '@/types/archive';
import type { Task } from '@/types';

const ArchivePage = () => {
  const [filters, setFilters] = useState<ArchiveFilters>({});
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const { data: archivedTasks = [], isLoading, refetch } = useArchivedTasks(filters);
  const { users = [], loading } = useOrganizationUsers();
  const { archiveTask, bulkArchive, isArchiving, isBulkArchiving } = useTaskArchive();

  const handleFilterChange = (key: keyof ArchiveFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedTasks(checked ? archivedTasks.map(task => task.id) : []);
  };

  const handleUnarchiveSelected = () => {
    if (selectedTasks.length === 0) return;
    
    if (selectedTasks.length === 1) {
      archiveTask({ taskId: selectedTasks[0], archive: false });
    } else {
      bulkArchive({ taskIds: selectedTasks, archive: false });
    }
    
    setSelectedTasks([]);
    setSelectAll(false);
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Archived Tasks</h1>
          <p className="text-muted-foreground mt-1">
            View and manage archived tasks ({archivedTasks.length} total)
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select
                value={filters.userId || 'all-users'}
                onValueChange={(value) => handleFilterChange('userId', value === 'all-users' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-users">All users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Archived From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleFilterChange('dateFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Archived To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleFilterChange('dateTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedTasks.length} selected</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUnarchiveSelected}
                  disabled={isBulkArchiving}
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isBulkArchiving ? 'Unarchiving...' : 'Unarchive Selected'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <Card>
        <CardContent className="p-0">
          {archivedTasks.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No archived tasks found</h3>
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Tasks will appear here after they are archived automatically or manually.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Select All Header */}
              <div className="border-b p-4 flex items-center gap-3">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select All ({archivedTasks.length})</span>
              </div>

              {/* Tasks */}
              <div className="divide-y">
                {archivedTasks.map((task: Task) => (
                  <div key={task.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={(checked) => handleSelectTask(task.id, !!checked)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-foreground truncate">
                            {task.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {task.archivedAt && (
                            <span>Archived: {format(task.archivedAt, 'MMM d, yyyy')}</span>
                          )}
                          {task.assignedToName && (
                            <span>Assigned to: {task.assignedToName}</span>
                          )}
                          {task.projectTitle && (
                            <span>Project: {task.projectTitle}</span>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => archiveTask({ taskId: task.id, archive: false })}
                        disabled={isArchiving}
                        variant="outline"
                        size="sm"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Unarchive
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchivePage;
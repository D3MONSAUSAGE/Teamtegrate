import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface RequestSearchFilters {
  search: string;
  status: string;
  priority: string;
  category: string;
  dateRange: string;
}

interface RequestSearchBarProps {
  onFiltersChange: (filters: RequestSearchFilters) => void;
  initialFilters?: RequestSearchFilters;
}

const DEFAULT_FILTERS: RequestSearchFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  category: 'all',
  dateRange: 'all'
};

const RequestSearchBar: React.FC<RequestSearchBarProps> = ({
  onFiltersChange,
  initialFilters = DEFAULT_FILTERS
}) => {
  const [filters, setFilters] = useState<RequestSearchFilters>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof RequestSearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'search' && value !== 'all'
  ) || filters.search.trim() !== '';

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'search' && value !== 'all'
    ).length + (filters.search.trim() ? 1 : 0);
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests by title, description, or ticket number..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 pr-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange('search', '')}
              className="absolute right-1 top-1 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="pending_acceptance">Pending Acceptance</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="time_schedule">Time & Schedule</SelectItem>
                    <SelectItem value="hr_admin">HR & Administration</SelectItem>
                    <SelectItem value="training">Training & Development</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="it_access">IT & Access</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RequestSearchBar;
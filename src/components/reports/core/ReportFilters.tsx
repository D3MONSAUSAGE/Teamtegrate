import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarIcon, Download, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInvoiceTeams } from '@/hooks/useInvoiceTeams';
import { useUsersByContext } from '@/hooks/useUsersByContext';
import { useAuth } from '@/contexts/AuthContext';

interface ReportFiltersProps {
  timeRange: string;
  dateRange?: DateRange;
  selectedTeamId?: string;
  selectedUserId?: string;
  onTimeRangeChange: (value: string) => void;
  onDateRangeChange: (value: DateRange | undefined) => void;
  onTeamChange?: (value: string) => void;
  onUserChange?: (value: string) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  showTeamFilter?: boolean;
  showUserFilter?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  timeRange,
  dateRange,
  selectedTeamId,
  selectedUserId,
  onTimeRangeChange,
  onDateRangeChange,
  onTeamChange,
  onUserChange,
  onExport,
  onRefresh,
  showTeamFilter = true,
  showUserFilter = true
}) => {
  const { user } = useAuth();
  const { teams, isLoading: teamsLoading, error: teamsError } = useInvoiceTeams();
  const { users, isLoading: usersLoading, error: usersError } = useUsersByContext(
    user?.organizationId,
    selectedTeamId || undefined
  );
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Handle team change and clear user selection
  const handleTeamChange = (value: string) => {
    onTeamChange?.(value);
    onUserChange?.(''); // Clear user selection when team changes
    setUserSearchQuery(''); // Clear search
  };

  // Filter users based on search query and role-based access
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let availableUsers = users;
    
    // Role-based filtering: managers can only see their team members + themselves
    if (user?.role === 'manager' && selectedTeamId) {
      // For managers, show team members + themselves
      availableUsers = users.filter(u => u.id === user.id || true); // useUsersByContext already filters by team
    }
    
    // Apply search filter
    if (userSearchQuery.trim()) {
      availableUsers = availableUsers.filter(u => 
        u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
      );
    }
    
    return availableUsers;
  }, [users, user, selectedTeamId, userSearchQuery]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Period:</span>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 days">7 Days</SelectItem>
                <SelectItem value="30 days">30 Days</SelectItem>
                <SelectItem value="90 days">90 Days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {timeRange === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-72 justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Team Filter */}
          {showTeamFilter && onTeamChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Team:</span>
              <Select 
                value={selectedTeamId || "all"} 
                onValueChange={handleTeamChange}
                disabled={teamsLoading}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={teamsLoading ? "Loading..." : "All Teams"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.member_count} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teamsError && (
                <span className="text-sm text-destructive">Error loading teams</span>
              )}
            </div>
          )}

          {/* User Filter */}
          {showUserFilter && onUserChange && selectedTeamId && selectedTeamId !== 'all' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">User:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-64 justify-between"
                    disabled={usersLoading}
                  >
                    <span className="truncate">
                      {selectedUserId && selectedUserId !== 'all' 
                        ? users?.find(u => u.id === selectedUserId)?.name || 'Unknown User'
                        : usersLoading ? 'Loading...' : 'All Users'
                      }
                    </span>
                    <Search className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <div className="p-2">
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div 
                      className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                      onClick={() => {
                        onUserChange('all');
                        setUserSearchQuery('');
                      }}
                    >
                      All Users
                    </div>
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => {
                          onUserChange(user.id);
                          setUserSearchQuery('');
                        }}
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && userSearchQuery && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {usersError && (
                <span className="text-sm text-destructive">Error loading users</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
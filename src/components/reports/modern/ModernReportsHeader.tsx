import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Moon, 
  Sun, 
  Calendar, 
  User, 
  Users,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  Clock,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDarkMode } from '@/hooks/useDarkMode';
import { useRoleBasedUsers } from '@/hooks/useRoleBasedUsers';
import { User as AppUser } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ModernReportsHeaderProps {
  currentUser: AppUser;
  selectedUser?: AppUser;
  timeRange: string;
  searchQuery: string;
  activeTab: string;
  onTimeRangeChange: (range: string) => void;
  onSearchChange: (query: string) => void;
  onUserSelect: (userId: string, userName: string) => void;
  onBackToPersonal: () => void;
  onTabChange: (tab: string) => void;
  onExport: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const ModernReportsHeader: React.FC<ModernReportsHeaderProps> = ({
  currentUser,
  selectedUser,
  timeRange,
  searchQuery,
  activeTab,
  onTimeRangeChange,
  onSearchChange,
  onUserSelect,
  onBackToPersonal,
  onTabChange,
  onExport,
  onRefresh,
  isLoading
}) => {
  const { isDark, toggle } = useDarkMode();
  const { users: availableUsers, isLoading: usersLoading, canViewTeamMembers } = useRoleBasedUsers();
  
  const viewingUser = selectedUser || currentUser;
  const isViewingSelf = !selectedUser || selectedUser.id === currentUser.id;

  const timeRangeOptions = [
    { value: '7 days', label: 'This Week', icon: <Calendar className="h-4 w-4" /> },
    { value: '30 days', label: 'This Month', icon: <Calendar className="h-4 w-4" /> },
    { value: '90 days', label: 'Last 3 Months', icon: <Calendar className="h-4 w-4" /> },
    { value: 'custom', label: 'Custom Range', icon: <Calendar className="h-4 w-4" /> }
  ];

  // Filter users based on search query (exclude current user from search results)
  const filteredMembers = availableUsers
    .filter(user => user.id !== currentUser.id)
    .filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
      
      <Card className="relative border-0 shadow-lg bg-card/80 backdrop-blur-sm">
        <div className="p-6 space-y-6">
          {/* Main Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              
              {/* Title and Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {isViewingSelf ? 'My Reports' : `${viewingUser.name}'s Reports`}
                  </h1>
                  {!isViewingSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onBackToPersonal}
                      className="text-xs"
                    >
                      Back to My Data
                    </Button>
                  )}
                </div>
                
                <p className="text-muted-foreground">
                  Analyze performance and track progress across your organization
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span>Analyzing {timeRange.toLowerCase()} performance</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - User Info and Controls */}
            <div className="flex items-center space-x-4">
              {/* User Avatar and Role */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={viewingUser.avatar_url} alt={viewingUser.name} />
                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {viewingUser.name?.charAt(0) || viewingUser.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {!isViewingSelf && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-2 w-2 text-primary-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-sm">{viewingUser.name}</div>
                  <Badge variant="secondary" className="text-xs">
                    {viewingUser.role.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="h-9 w-9"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Left Side - Tabs and Time Range */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Tab Navigation */}
              <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Comprehensive
              </TabsTrigger>
              <TabsTrigger value="legacy" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Legacy View
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Analytics
              </TabsTrigger>
            </TabsList>
              </Tabs>

              {/* Time Range Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{timeRangeOptions.find(opt => opt.value === timeRange)?.label || 'This Week'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {timeRangeOptions.map(option => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => onTimeRangeChange(option.value)}
                      className="flex items-center space-x-2"
                    >
                      {option.icon}
                      <span>{option.label}</span>
                      {option.value === timeRange && (
                        <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Active Context Badge */}
              {!isViewingSelf && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Viewing: {selectedUser?.name}</span>
                </Badge>
              )}
            </div>

            {/* Right Side - Search and Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* User Search (Managers+ only) */}
              {canViewTeamMembers && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Search className="h-4 w-4" />
                      <span>Find Team Member</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-2">
                      <Input
                        placeholder="Search team members..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="mb-2"
                      />
                      {usersLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Loading team members...
                        </div>
                      ) : searchQuery ? (
                        <div className="max-h-48 overflow-y-auto">
                          {filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                              <DropdownMenuItem
                                key={member.id}
                                onClick={() => onUserSelect(member.id, member.name)}
                                className="flex items-center space-x-3 p-2 cursor-pointer"
                              >
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium">
                                    {member.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{member.name}</div>
                                  <div className="text-xs text-muted-foreground">{member.email}</div>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {member.role}
                                </Badge>
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No team members found
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Start typing to search team members...
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className={cn(
                    "h-9 w-9",
                    isLoading && "animate-spin"
                  )}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={onExport}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  ChevronDown,
  User,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { hasRoleAccess } from '@/contexts/auth';
import { User as AppUser } from '@/types';

interface SmartFilterBarProps {
  currentUser: AppUser;
  selectedUser?: AppUser;
  timeRange: string;
  searchQuery: string;
  onTimeRangeChange: (range: string) => void;
  onSearchChange: (query: string) => void;
  onUserSelect: (userId: string, userName: string) => void;
  onExport: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const SmartFilterBar: React.FC<SmartFilterBarProps> = ({
  currentUser,
  selectedUser,
  timeRange,
  searchQuery,
  onTimeRangeChange,
  onSearchChange,
  onUserSelect,
  onExport,
  onRefresh,
  isLoading
}) => {
  const canSearchUsers = hasRoleAccess(currentUser.role, 'manager');
  const isViewingSelf = !selectedUser || selectedUser.id === currentUser.id;

  const timeRangeOptions = [
    { value: '7 days', label: 'This Week', icon: <Calendar className="h-4 w-4" /> },
    { value: '30 days', label: 'This Month', icon: <Calendar className="h-4 w-4" /> },
    { value: '90 days', label: 'Last 3 Months', icon: <Calendar className="h-4 w-4" /> },
    { value: 'custom', label: 'Custom Range', icon: <Calendar className="h-4 w-4" /> }
  ];

  // Mock team members for search (in real app, this would come from props)
  const mockTeamMembers = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'manager' },
    { id: '2', name: 'Mike Chen', email: 'mike@company.com', role: 'user' },
    { id: '3', name: 'Emily Davis', email: 'emily@company.com', role: 'user' }
  ].filter(member => member.id !== currentUser.id);

  const filteredMembers = mockTeamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm animate-fade-in">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Left side - Time range and context */}
          <div className="flex flex-wrap items-center gap-3">
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
                      <Badge variant="secondary" className="ml-auto">Current</Badge>
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

          {/* Right side - Search and actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* User Search (Managers+ only) */}
            {canSearchUsers && (
              <div className="relative">
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
                      {searchQuery && (
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
                                    {member.name.charAt(0)}
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
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
      </CardContent>
    </Card>
  );
};
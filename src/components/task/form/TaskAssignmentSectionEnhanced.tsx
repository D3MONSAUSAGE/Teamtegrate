
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Users, User, Search, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppUser } from '@/types';
import TaskAssigneeSelect from './TaskAssigneeSelect';

interface TaskAssignmentSectionEnhancedProps {
  selectedMember: string;
  selectedMembers?: string[];
  onAssign: (userId: string) => void;
  onMembersChange?: (memberIds: string[]) => void;
  users: AppUser[];
  isLoading: boolean;
  multiSelect?: boolean;
}

const TaskAssignmentSectionEnhanced: React.FC<TaskAssignmentSectionEnhancedProps> = ({
  selectedMember,
  selectedMembers = [],
  onAssign,
  onMembersChange,
  users,
  isLoading,
  multiSelect = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  console.log('TaskAssignmentSectionEnhanced - render:', { 
    multiSelect, 
    isLoading, 
    usersLength: users?.length,
    selectedMembersLength: selectedMembers?.length
  });

  const safeSelectedMembers = Array.isArray(selectedMembers) ? selectedMembers : [];
  const safeUsers = Array.isArray(users) ? users.filter(user => user && user.id && user.name) : [];
  const safeOnMembersChange = typeof onMembersChange === 'function' ? onMembersChange : () => {};
  
  const selectedUsers = safeUsers.filter(user => safeSelectedMembers.includes(user.id));
  const availableUsers = safeUsers.filter(user => 
    !safeSelectedMembers.includes(user.id) && 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (userId: string) => {
    if (multiSelect && onMembersChange) {
      if (safeSelectedMembers.includes(userId)) {
        safeOnMembersChange(safeSelectedMembers.filter(id => id !== userId));
      } else {
        safeOnMembersChange([...safeSelectedMembers, userId]);
      }
    } else {
      onAssign(userId);
    }
    setOpen(false);
    setSearchTerm('');
  };

  const removeUser = (userId: string) => {
    if (multiSelect && onMembersChange) {
      safeOnMembersChange(safeSelectedMembers.filter(id => id !== userId));
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserStatus = (userId: string) => {
    // Mock status for demo - in real app, this would come from your user status system
    const statuses = ['online', 'busy', 'away', 'offline'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-border/30 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary animate-spin" />
            <Label className="font-medium">Loading team members...</Label>
          </div>
          <div className="animate-pulse bg-muted rounded-md h-10 w-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!multiSelect) {
    return (
      <Card className="border-2 border-border/30 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <Label className="font-medium">Assign To</Label>
          </div>
          <TaskAssigneeSelect 
            selectedMember={selectedMember}
            onAssign={onAssign}
            users={users}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border/30 shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <Label className="font-medium">Team Assignment</Label>
          <Badge variant="outline" className="ml-auto">
            {safeSelectedMembers.length} member{safeSelectedMembers.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Selected Members Display */}
        {selectedUsers.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Assigned Members</Label>
            <div className="space-y-2">
              {selectedUsers.map((user) => {
                const status = getUserStatus(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-200/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                          getStatusColor(status)
                        )} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{status}</div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUser(user.id)}
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Member Section */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Add Team Members</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between border-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>Search and add team members...</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-background/95 backdrop-blur-xl border-2">
              <Command>
                <CommandInput 
                  placeholder="Search team members..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <span>No team members found</span>
                  </div>
                </CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {availableUsers.map((user) => {
                    const status = getUserStatus(user.id);
                    return (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleSelectUser(user.id)}
                        className="flex items-center gap-3 p-3 cursor-pointer"
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                            getStatusColor(status)
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{status}</div>
                        </div>
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Assignment Summary */}
        {safeSelectedMembers.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-green-50/50 to-blue-50/50 rounded-lg border border-green-200/30">
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">
                {safeSelectedMembers.length} team member{safeSelectedMembers.length !== 1 ? 's' : ''} assigned
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All assigned members will receive notifications about this task
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskAssignmentSectionEnhanced;

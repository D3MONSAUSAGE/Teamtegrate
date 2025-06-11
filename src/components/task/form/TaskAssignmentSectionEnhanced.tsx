
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User, Clock, AlertTriangle } from "lucide-react";
import { AppUser } from '@/types';
import TaskAssigneeSelect from './TaskAssigneeSelect';
import AssignedMemberCard from './assignment/AssignedMemberCard';
import UserSearchDropdown from './assignment/UserSearchDropdown';
import AssignmentSummary from './assignment/AssignmentSummary';
import { getUserInitials, getUserStatus, getStatusColor } from './assignment/utils';
import TaskMultiAssigneeSelect from './TaskMultiAssigneeSelect';
import { toast } from '@/components/ui/sonner';

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
    selectedMembersLength: selectedMembers?.length,
    usersIsArray: Array.isArray(users),
    selectedMembersIsArray: Array.isArray(selectedMembers)
  });

  // Enhanced runtime safety checks
  const isValidArray = (arr: any): arr is any[] => {
    return Array.isArray(arr) && arr !== null && arr !== undefined;
  };

  const isValidUser = (user: any): user is AppUser => {
    return user && 
           typeof user === 'object' && 
           typeof user.id === 'string' && 
           typeof user.name === 'string' && 
           user.id.length > 0;
  };

  // Safe data operations with comprehensive validation
  const safeSelectedMembers = isValidArray(selectedMembers) ? selectedMembers.filter(id => typeof id === 'string' && id.length > 0) : [];
  const safeUsers = isValidArray(users) ? users.filter(isValidUser) : [];
  const safeOnMembersChange = typeof onMembersChange === 'function' ? onMembersChange : () => {
    console.error('TaskAssignmentSectionEnhanced: onMembersChange is not a function');
    toast.error('Error: Assignment function not available');
  };

  // Data readiness validation
  const isDataReady = !isLoading && isValidArray(users);
  const hasValidUsers = safeUsers.length > 0;

  const selectedUsers = hasValidUsers ? safeUsers.filter(user => safeSelectedMembers.includes(user.id)) : [];
  const availableUsers = hasValidUsers ? safeUsers.filter(user => 
    !safeSelectedMembers.includes(user.id) && 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleSelectUser = (userId: string) => {
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId in handleSelectUser:', userId);
      return;
    }

    try {
      if (multiSelect && typeof onMembersChange === 'function') {
        if (safeSelectedMembers.includes(userId)) {
          safeOnMembersChange(safeSelectedMembers.filter(id => id !== userId));
        } else {
          safeOnMembersChange([...safeSelectedMembers, userId]);
        }
      } else if (typeof onAssign === 'function') {
        onAssign(userId);
      }
      setOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error in handleSelectUser:', error);
      toast.error('Error selecting team member');
    }
  };

  const removeUser = (userId: string) => {
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId in removeUser:', userId);
      return;
    }

    try {
      if (multiSelect && typeof onMembersChange === 'function') {
        safeOnMembersChange(safeSelectedMembers.filter(id => id !== userId));
      }
    } catch (error) {
      console.error('Error in removeUser:', error);
      toast.error('Error removing team member');
    }
  };

  const handleMultiAssignError = () => {
    console.error('Error in multi-assignment component');
    toast.error('Error managing team assignments');
  };

  // Loading state
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

  // Data not ready state
  if (!isDataReady) {
    return (
      <Card className="border-2 border-destructive/30 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <Label className="font-medium text-destructive">Team data not available</Label>
          </div>
          <div className="text-sm text-muted-foreground">
            Unable to load team members. Please try refreshing the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Single assignment mode
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
            users={safeUsers}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    );
  }

  // Multi-assignment mode with enhanced data validation
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

        {/* Multi-assignee selector with enhanced safety */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Select Team Members</Label>
          <TaskMultiAssigneeSelect
            selectedMembers={safeSelectedMembers}
            onMembersChange={safeOnMembersChange}
            users={safeUsers}
            isLoading={isLoading}
            onError={handleMultiAssignError}
          />
        </div>

        {/* Assignment Summary */}
        <AssignmentSummary selectedMembersCount={safeSelectedMembers.length} />
      </CardContent>
    </Card>
  );
};

export default TaskAssignmentSectionEnhanced;

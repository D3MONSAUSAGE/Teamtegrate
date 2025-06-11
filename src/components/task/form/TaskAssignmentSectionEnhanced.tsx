
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User, Clock } from "lucide-react";
import { AppUser } from '@/types';
import TaskAssigneeSelect from './TaskAssigneeSelect';
import AssignedMemberCard from './assignment/AssignedMemberCard';
import UserSearchDropdown from './assignment/UserSearchDropdown';
import AssignmentSummary from './assignment/AssignmentSummary';
import { getUserInitials, getUserStatus, getStatusColor } from './assignment/utils';
import TaskMultiAssigneeSelect from '../TaskMultiAssigneeSelect';
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

  const handleMultiAssignError = () => {
    console.error('Error in multi-assignment component');
    toast.error('Error managing team assignments');
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

        {/* Multi-assignee selector with error handling */}
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

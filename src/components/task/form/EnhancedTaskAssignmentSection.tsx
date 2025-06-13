
import React from 'react';
import { User } from '@/types';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTaskAssignmentValidation } from '@/hooks/useTaskAssignmentValidation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCircle, Shield, Crown, Users } from 'lucide-react';

interface EnhancedTaskAssignmentSectionProps {
  selectedMember?: string;
  onAssign: (userId: string) => void;
  users: User[];
  isLoading: boolean;
  multiAssignMode?: boolean;
  selectedMembers?: string[];
  onMembersChange?: (memberIds: string[]) => void;
}

const EnhancedTaskAssignmentSection: React.FC<EnhancedTaskAssignmentSectionProps> = ({
  selectedMember = "unassigned",
  onAssign,
  users,
  isLoading,
  multiAssignMode = false,
  selectedMembers = [],
  onMembersChange
}) => {
  const { 
    filterAssignableUsers, 
    getAssignmentPermissions,
    validateUserAssignment
  } = useTaskAssignmentValidation();

  const permissions = getAssignmentPermissions();
  const assignableUsers = filterAssignableUsers(users);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin': return <Shield className="h-3 w-3 text-blue-500" />;
      case 'manager': return <Users className="h-3 w-3 text-green-500" />;
      default: return <UserCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const handleSingleAssignment = (userId: string) => {
    if (validateUserAssignment(userId, users)) {
      onAssign(userId);
    }
  };

  const handleMultiAssignment = (userId: string) => {
    if (!onMembersChange) return;

    const newSelection = selectedMembers.includes(userId)
      ? selectedMembers.filter(id => id !== userId)
      : [...selectedMembers, userId];

    onMembersChange(newSelection);
  };

  if (multiAssignMode) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Assign Multiple Team Members</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
            {assignableUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedMembers.includes(user.id)
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleMultiAssignment(user.id)}
              >
                <div className="flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  <span className="font-medium">{user.name || user.email}</span>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
                {selectedMembers.includes(user.id) && (
                  <Badge variant="default" className="text-xs">
                    Selected
                  </Badge>
                )}
              </div>
            ))}
          </div>
          {selectedMembers.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Assign Task</Label>
        {!permissions.canAssign && (
          <div className="text-sm text-destructive">
            You don't have permission to assign tasks
          </div>
        )}
        <Select 
          value={selectedMember} 
          onValueChange={handleSingleAssignment} 
          disabled={isLoading || !permissions.canAssign}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-gray-400" />
                Unassigned
              </div>
            </SelectItem>
            {assignableUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span>{user.name || user.email}</span>
                  </div>
                  <Badge variant="outline" className="text-xs ml-2">
                    {user.role}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {permissions.canOnlyAssignSelf && (
          <div className="text-xs text-muted-foreground">
            You can only assign tasks to yourself
          </div>
        )}
        
        {assignableUsers.length === 0 && users.length > 0 && (
          <div className="text-xs text-destructive">
            No users available for assignment in your organization
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTaskAssignmentSection;

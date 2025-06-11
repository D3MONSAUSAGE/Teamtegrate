
import React from 'react';
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from '@/types';
import { Users, UserCheck } from 'lucide-react';
import TaskAssigneeSelect from './TaskAssigneeSelect';

interface TaskAssignmentSectionProps {
  selectedMember: string;
  onAssign: (userId: string) => void;
  users: User[];
  isLoading?: boolean;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  selectedMember,
  onAssign,
  users,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignment
          </CardTitle>
          <CardDescription>Loading team members...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const selectedUser = users.find(user => user.id === selectedMember);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assignment
        </CardTitle>
        <CardDescription>
          Assign this task to a team member
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Assigned To</Label>
          <TaskAssigneeSelect
            users={users}
            selectedUser={selectedMember}
            onUserSelect={onAssign}
            placeholder="Select team member"
          />
        </div>
        
        {selectedUser && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <UserCheck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Assigned to {selectedUser.name || selectedUser.email}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskAssignmentSection;

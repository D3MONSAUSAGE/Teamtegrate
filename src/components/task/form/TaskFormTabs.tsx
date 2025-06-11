
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User } from '@/types'; // Removed AppUser import
import { Users, FileText } from 'lucide-react';
import TaskAssignmentSectionEnhanced from './TaskAssignmentSectionEnhanced';

interface TaskFormTabsProps {
  children: React.ReactNode;
  assignedUsers: string[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
  users: User[]; // Changed from AppUser to User
  isLoadingUsers?: boolean;
}

const TaskFormTabs: React.FC<TaskFormTabsProps> = ({
  children,
  assignedUsers,
  onAssign,
  onUnassign,
  users,
  isLoadingUsers = false
}) => {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Details
        </TabsTrigger>
        <TabsTrigger value="assignment" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Assignment
          {assignedUsers.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {assignedUsers.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        {children}
      </TabsContent>
      
      <TabsContent value="assignment">
        <TaskAssignmentSectionEnhanced
          assignedUsers={assignedUsers}
          onAssign={onAssign}
          onUnassign={onUnassign}
          users={users}
          isLoading={isLoadingUsers}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TaskFormTabs;

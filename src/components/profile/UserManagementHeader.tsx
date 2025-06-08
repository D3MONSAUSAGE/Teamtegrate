
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from 'lucide-react';

interface UserManagementHeaderProps {
  userCount: number;
}

const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({ userCount }) => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        User Management
        <Badge variant="outline" className="ml-auto">
          {userCount} Users
        </Badge>
      </CardTitle>
    </CardHeader>
  );
};

export default UserManagementHeader;

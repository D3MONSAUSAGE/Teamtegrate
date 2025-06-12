
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

interface UserContextCardProps {
  user: any;
}

const UserContextCard: React.FC<UserContextCardProps> = ({ user }) => {
  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Current User Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="font-medium">Email:</span>
          <span>{user.email}</span>
          <span className="font-medium">Role:</span>
          <span>{user.role}</span>
          <span className="font-medium">Organization ID:</span>
          <span className="font-mono text-xs">{user.organizationId || 'NOT SET'}</span>
          <span className="font-medium">User ID:</span>
          <span className="font-mono text-xs">{user.id}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserContextCard;

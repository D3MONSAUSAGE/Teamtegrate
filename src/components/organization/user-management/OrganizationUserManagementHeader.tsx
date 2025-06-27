
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus, Users, Database } from 'lucide-react';

interface OrganizationUserManagementHeaderProps {
  userCount: number;
  currentUserRole: string | undefined;
  isLoading: boolean;
  isChecking: boolean;
  onRefresh: () => void;
  onDataSyncCheck: () => void;
  onCreateUser: () => void;
}

const OrganizationUserManagementHeader: React.FC<OrganizationUserManagementHeaderProps> = ({
  userCount,
  currentUserRole,
  isLoading,
  isChecking,
  onRefresh,
  onDataSyncCheck,
  onCreateUser
}) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Team Members ({userCount})
      </CardTitle>
      <div className="flex items-center gap-2">
        {currentUserRole === 'superadmin' && (
          <Button 
            onClick={onDataSyncCheck}
            variant="outline" 
            size="sm"
            disabled={isChecking}
          >
            <Database className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Check Sync
          </Button>
        )}
        <Button 
          onClick={onRefresh}
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        {currentUserRole === 'superadmin' && (
          <Button 
            onClick={onCreateUser}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>
    </CardHeader>
  );
};

export default OrganizationUserManagementHeader;

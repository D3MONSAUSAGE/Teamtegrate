import React from 'react';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';
import JobRoleBadge from '@/components/JobRoleBadge';

interface UserJobRolesCellProps {
  userId: string;
}

const UserJobRolesCell: React.FC<UserJobRolesCellProps> = ({ userId }) => {
  const { userJobRoles, primaryJobRole } = useUserJobRoles(userId);

  if (!userJobRoles || userJobRoles.length === 0) {
    return <span className="text-muted-foreground text-sm">No roles assigned</span>;
  }

  // Show primary role first, then others
  const sortedRoles = [...userJobRoles].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  return (
    <div className="flex flex-wrap gap-1">
      {sortedRoles.slice(0, 2).map((userJobRole) => (
        <JobRoleBadge
          key={userJobRole.id}
          roleName={userJobRole.job_role?.name || 'Unknown Role'}
          isPrimary={userJobRole.is_primary}
          size="sm"
          showIcon={false}
        />
      ))}
      {sortedRoles.length > 2 && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          +{sortedRoles.length - 2} more
        </span>
      )}
    </div>
  );
};

export default UserJobRolesCell;
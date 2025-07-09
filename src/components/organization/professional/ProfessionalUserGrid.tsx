
import React from 'react';
import ProfessionalUserCard from './ProfessionalUserCard';
import ProfessionalUserListItem from './ProfessionalUserListItem';

interface ProfessionalUserGridProps {
  users: any[];
  viewMode: 'grid' | 'list';
  onViewProfile: (userId: string) => void;
  onEditUser: (user: any) => void;
  onDeleteUser: (user: any) => void;
}

const ProfessionalUserGrid: React.FC<ProfessionalUserGridProps> = ({
  users,
  viewMode,
  onViewProfile,
  onEditUser,
  onDeleteUser
}) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {users.map((user) => (
          <ProfessionalUserListItem
            key={user.id}
            user={user}
            onViewProfile={onViewProfile}
            onEditUser={onEditUser}
            onDeleteUser={onDeleteUser}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {users.map((user) => (
        <ProfessionalUserCard
          key={user.id}
          user={user}
          onViewProfile={onViewProfile}
          onEditUser={onEditUser}
          onDeleteUser={onDeleteUser}
        />
      ))}
    </div>
  );
};

export default ProfessionalUserGrid;

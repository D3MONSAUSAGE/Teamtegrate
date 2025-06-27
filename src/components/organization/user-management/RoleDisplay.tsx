
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Users } from 'lucide-react';
import { UserRole } from '@/types';

interface RoleDisplayProps {
  role: UserRole;
}

const RoleDisplay: React.FC<RoleDisplayProps> = ({ role }) => {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'manager': return <Users className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'manager': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Badge variant="outline" className={getRoleColor(role)}>
      {getRoleIcon(role)}
      <span className="ml-1 capitalize">{role}</span>
    </Badge>
  );
};

export default RoleDisplay;

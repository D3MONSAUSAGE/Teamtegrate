
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Shield, Users } from 'lucide-react';
import { UserRole } from '@/types';

interface RoleSelectorProps {
  availableRoles: UserRole[];
  isChangingRole: boolean;
  onRoleSelect: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  availableRoles,
  isChangingRole,
  onRoleSelect
}) => {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'manager': return <Users className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  if (availableRoles.length === 0) {
    return null;
  }

  return (
    <Select onValueChange={onRoleSelect} disabled={isChangingRole}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Change" />
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => (
          <SelectItem key={role} value={role}>
            <div className="flex items-center gap-2">
              {getRoleIcon(role)}
              <span className="capitalize">{role}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RoleSelector;

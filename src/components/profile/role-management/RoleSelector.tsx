
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Star, Shield, Crown, User } from 'lucide-react';
import { UserRole, getRoleDisplayName } from '@/types';
import RoleSelectTrigger from './RoleSelectTrigger';

interface RoleSelectorProps {
  availableRoles: UserRole[];
  isChanging: boolean;
  onRoleSelect: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  availableRoles,
  isChanging,
  onRoleSelect
}) => {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <Star className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <Select onValueChange={(value) => onRoleSelect(value as UserRole)}>
      <RoleSelectTrigger isChanging={isChanging} />
      <SelectContent>
        {availableRoles.map((role) => (
          <SelectItem key={role} value={role}>
            <span className="flex items-center gap-2">
              {getRoleIcon(role)}
              {getRoleDisplayName(role)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RoleSelector;

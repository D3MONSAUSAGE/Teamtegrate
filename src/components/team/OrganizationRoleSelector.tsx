import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Crown, Shield, Users, User } from 'lucide-react';
import { UserRole } from '@/types';

interface OrganizationRoleSelectorProps {
  value: UserRole;
  onValueChange: (role: UserRole) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  showIcons?: boolean;
}

const OrganizationRoleSelector: React.FC<OrganizationRoleSelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
  label = "Organization Role",
  placeholder = "Select organization role",
  showIcons = true
}) => {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'manager':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return 'Super Administrator';
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      default:
        return 'User';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="org-role">{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id="org-role">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">
            <div className="flex items-center gap-2">
              {showIcons && getRoleIcon('user')}
              {getRoleDisplayName('user')}
            </div>
          </SelectItem>
          <SelectItem value="manager">
            <div className="flex items-center gap-2">
              {showIcons && getRoleIcon('manager')}
              {getRoleDisplayName('manager')}
            </div>
          </SelectItem>
          <SelectItem value="admin">
            <div className="flex items-center gap-2">
              {showIcons && getRoleIcon('admin')}
              {getRoleDisplayName('admin')}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrganizationRoleSelector;
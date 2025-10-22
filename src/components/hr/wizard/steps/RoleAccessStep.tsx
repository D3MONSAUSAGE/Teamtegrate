import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeFormData } from '@/types/employee';
import { UserRole } from '@/types';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

interface RoleAccessStepProps {
  formData: EmployeeFormData;
  onChange: (data: Partial<EmployeeFormData>) => void;
}

const RoleAccessStep: React.FC<RoleAccessStepProps> = ({ formData, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    onChange({ temporary_password: password });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Role & Access</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure the employee's system role and initial login credentials.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">
            System Role <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.role}
            onValueChange={(value) => onChange({ role: value as UserRole })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Team Member</SelectItem>
              <SelectItem value="team_leader">Team Leader</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Determines what features and data the employee can access
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="temporary_password">
            Temporary Password <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="temporary_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.temporary_password}
                onChange={(e) => onChange({ temporary_password: e.target.value })}
                placeholder="Enter temporary password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={generatePassword}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Employee will be prompted to change this on first login
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleAccessStep;


import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProfileFormProps {
  name: string;
  email: string | undefined;
  role: string | undefined;
  onNameChange: (value: string) => void;
}

export const ProfileForm = ({ 
  name, 
  email, 
  role, 
  onNameChange 
}: ProfileFormProps) => {
  return (
    <div className="flex-1 space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email" 
          defaultValue={email} 
          readOnly 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input 
          id="role" 
          defaultValue={role === 'manager' ? 'Manager' : 'User'} 
          readOnly 
        />
      </div>
    </div>
  );
};

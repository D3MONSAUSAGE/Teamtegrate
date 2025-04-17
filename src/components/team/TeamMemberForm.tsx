
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import useTeamMemberForm from '@/hooks/useTeamMemberForm';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface TeamMemberFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const TeamMemberForm: React.FC<TeamMemberFormProps> = ({ onCancel, onSuccess }) => {
  const { formData, handleInputChange, handleSubmit, isLoading } = useTeamMemberForm({
    onSuccess,
    onCancel,
  });
  
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input 
          id="name" 
          value={formData.name} 
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="John Doe" 
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          value={formData.email} 
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="johndoe@example.com" 
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input 
            id="password" 
            type={showPassword ? "text" : "password"} 
            value={formData.password} 
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter password" 
            disabled={isLoading}
          />
          <button 
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => handleInputChange('role', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Team Member</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <DialogFooter className="pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
            </>
          ) : (
            'Add Team Member'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default TeamMemberForm;

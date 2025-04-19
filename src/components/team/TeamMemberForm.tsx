
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import useTeamMemberForm from '@/hooks/useTeamMemberForm';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';

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
        <Label htmlFor="name">Name *</Label>
        <Input 
          id="name" 
          value={formData.name} 
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="John Doe" 
          disabled={isLoading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          type="email" 
          value={formData.email} 
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="johndoe@example.com" 
          disabled={isLoading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => handleInputChange('role', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Developer">Developer</SelectItem>
            <SelectItem value="Designer">Designer</SelectItem>
            <SelectItem value="Project Manager">Project Manager</SelectItem>
            <SelectItem value="QA Engineer">QA Engineer</SelectItem>
            <SelectItem value="DevOps">DevOps</SelectItem>
            <SelectItem value="Product Owner">Product Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input 
            id="password" 
            type={showPassword ? "text" : "password"}
            value={formData.password} 
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter password for the team member" 
            disabled={isLoading || formData.verified}
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            className="absolute right-0 top-0 h-full"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || formData.verified}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {formData.verified ? 
            "Password not required when marked as verified" : 
            "Password the team member will use to login"
          }
        </p>
      </div>
      
      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="verified"
          checked={formData.verified}
          onCheckedChange={(checked) => handleInputChange('verified', checked)}
          disabled={isLoading}
        />
        <Label htmlFor="verified" className="cursor-pointer">
          Mark as verified user
        </Label>
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

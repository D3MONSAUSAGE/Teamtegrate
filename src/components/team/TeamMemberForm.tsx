
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import useTeamMemberForm from '@/hooks/useTeamMemberForm';
import { Loader2 } from 'lucide-react';

interface TeamMemberFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const TeamMemberForm: React.FC<TeamMemberFormProps> = ({ onCancel, onSuccess }) => {
  const { formData, handleInputChange, handleSubmit, isLoading } = useTeamMemberForm({
    onSuccess,
    onCancel,
  });
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
        <p className="text-xs text-muted-foreground">
          The user must already have an account in the system
        </p>
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

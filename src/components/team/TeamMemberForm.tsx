
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import useTeamMemberForm from '@/hooks/useTeamMemberForm';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamMemberFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const TeamMemberForm: React.FC<TeamMemberFormProps> = ({ onCancel, onSuccess }) => {
  const { formData, handleInputChange, handleSubmit, isLoading, error } = useTeamMemberForm({
    onSuccess,
    onCancel,
  });
  
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
      
      {showHelp && (
        <Alert className="bg-blue-50 text-blue-800 border-blue-200">
          <AlertDescription className="text-sm">
            <p className="font-medium mb-1">How to add team members:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>The user must first create an account in the login page</li>
              <li>Then you can add them as a team member using their email</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="text-center">
        <Button 
          type="button" 
          variant="link" 
          onClick={() => setShowHelp(!showHelp)} 
          className="text-xs"
        >
          {showHelp ? "Hide help" : "Need help?"}
        </Button>
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

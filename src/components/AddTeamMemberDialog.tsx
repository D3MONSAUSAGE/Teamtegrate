
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamMemberAdded: () => void;
}

const AddTeamMemberDialog = ({ open, onOpenChange, onTeamMemberAdded }: AddTeamMemberDialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!name.trim() || !email.trim() || !role) {
      toast.error('Please fill in all fields');
      return;
    }

    // Generate a simple ID - in a real app this would come from the database
    const teamMember = {
      id: `tm-${Date.now()}`, // Simple ID generation for demonstration
      name: name.trim(),
      email: email.trim(),
      role,
      managerId: user?.id || ''
    };

    // Get existing team members from localStorage or initialize empty array
    const existingMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
    
    // Check if email already exists
    if (existingMembers.some((member: any) => member.email.toLowerCase() === email.toLowerCase())) {
      toast.error('A team member with this email already exists');
      return;
    }
    
    // Add new team member
    const updatedMembers = [...existingMembers, teamMember];
    localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
    
    // Clear form and close dialog
    setName('');
    setEmail('');
    setRole('Developer');
    
    toast.success('Team member added successfully');
    onTeamMemberAdded();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="johndoe@example.com" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
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
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Team Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberDialog;

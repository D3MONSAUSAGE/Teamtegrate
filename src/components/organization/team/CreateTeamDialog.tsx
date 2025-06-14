
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users } from 'lucide-react';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useUsers } from '@/hooks/useUsers';
import { CreateTeamData } from '@/types/teams';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { createTeam, isCreating } = useTeamManagement();
  const { users } = useUsers();
  
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    description: '',
    manager_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    try {
      await createTeam({
        ...formData,
        manager_id: formData.manager_id || undefined,
      });
      
      setFormData({ name: '', description: '', manager_id: '' });
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', manager_id: '' });
    onOpenChange(false);
  };

  // Filter users who can be managers (admin, manager, or superadmin roles)
  const potentialManagers = users.filter(user => 
    ['admin', 'manager', 'superadmin'].includes(user.role)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Team
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Team Manager</Label>
            <Select
              value={formData.manager_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, manager_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No manager assigned</SelectItem>
                {potentialManagers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !formData.name.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;

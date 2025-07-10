
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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserFormData } from '@/types/forms';
import { devLog } from '@/utils/devLogger';
import { logger } from '@/utils/logger';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: UserInfo;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  isOpen,
  onClose,
  onUserUpdated,
  user
}) => {
  const [name, setName] = useState(user.name);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsUpdating(true);
    try {
      devLog.userOperation('Updating user', { userId: user.id, newName: name });
      
      const { error } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      logger.userAction('User updated successfully', { userId: user.id });
      toast.success('User updated successfully');
      onUserUpdated();
      onClose();
    } catch (error) {
      logger.error('Error updating user', error);
      toast.error('Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setName(user.name); // Reset to original name
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user.email}
              readOnly
              className="opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={user.role === "manager" ? "Manager" : user.role === "admin" ? "Admin" : user.role === "superadmin" ? "Super Admin" : "User"}
              readOnly
              className="opacity-60 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;

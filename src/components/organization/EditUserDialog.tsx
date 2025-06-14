
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onUserUpdated: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated
}) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !user?.id) {
      toast.error('Name and email are required');
      return;
    }

    // Verify superadmin role
    if (currentUser?.role !== 'superadmin') {
      toast.error('Only superadmins can edit users');
      return;
    }

    // Prevent editing self
    if (currentUser.id === user.id) {
      toast.error('You cannot edit your own account');
      return;
    }

    setIsUpdating(true);
    try {
      console.log('Updating user:', user.id, formData);
      
      // Update user in database
      const { error: dbError } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim()
        })
        .eq('id', user.id)
        .eq('organization_id', currentUser.organizationId);

      if (dbError) {
        console.error('Database update error:', dbError);
        throw new Error(`Failed to update user: ${dbError.message}`);
      }

      // Log audit trail
      await logUserAction(user.id, user.email, user.name, {
        name: user.name,
        email: user.email
      }, formData);

      console.log('User update completed successfully');
      toast.success(`User ${formData.name} has been updated successfully`);
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const logUserAction = async (
    targetUserId: string, 
    targetEmail: string, 
    targetName: string,
    oldValues: any, 
    newValues: any
  ) => {
    if (!currentUser?.organizationId || !currentUser?.email) return;

    try {
      await supabase.from('user_management_audit').insert({
        organization_id: currentUser.organizationId,
        action_type: 'update',
        target_user_id: targetUserId,
        target_user_email: targetEmail,
        target_user_name: targetName,
        performed_by_user_id: currentUser.id,
        performed_by_email: currentUser.email,
        old_values: oldValues,
        new_values: newValues,
        ip_address: null,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User Profile
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Current Role</Label>
            <Input
              id="role"
              value={user.role}
              readOnly
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Use role management actions to change user roles.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;

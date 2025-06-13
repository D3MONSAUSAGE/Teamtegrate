
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Crown, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onOpenChange,
  onUserCreated
}) => {
  const { createUser, users } = useEnhancedUserManagement();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user' as UserRole,
    temporaryPassword: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, temporaryPassword: password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.name || !formData.temporaryPassword) {
      return;
    }

    setIsCreating(true);
    try {
      await createUser(formData.email, formData.name, formData.role, formData.temporaryPassword);
      
      // Reset form
      setFormData({
        email: '',
        name: '',
        role: 'user',
        temporaryPassword: ''
      });
      
      onUserCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      name: '',
      role: 'user',
      temporaryPassword: ''
    });
    onOpenChange(false);
  };

  // Check if a superadmin already exists
  const existingSuperadmin = users?.find(u => u.role === 'superadmin');
  const superadminSelected = formData.role === 'superadmin';
  const canCreateSuperadmin = !existingSuperadmin;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="superadmin" disabled={!canCreateSuperadmin}>
                Superadmin {!canCreateSuperadmin ? '(Already exists)' : ''}
              </option>
            </select>
            
            {superadminSelected && existingSuperadmin && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span>A superadmin already exists: <strong>{existingSuperadmin.name}</strong></span>
                  </div>
                  <p className="mt-1">Only one superadmin is allowed per organization. Please select a different role.</p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Temporary Password</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
              >
                Generate
              </Button>
            </div>
            <Input
              id="password"
              type="text"
              value={formData.temporaryPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, temporaryPassword: e.target.value }))}
              placeholder="Temporary password for first login"
              required
            />
            <p className="text-xs text-muted-foreground">
              User will be prompted to change this password on first login.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || (superadminSelected && !canCreateSuperadmin)}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;

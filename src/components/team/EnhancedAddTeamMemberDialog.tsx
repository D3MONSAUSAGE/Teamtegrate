import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/types';
import OrganizationRoleSelector from './OrganizationRoleSelector';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EnhancedAddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamMemberAdded: () => void;
  teamId?: string;
}

const EnhancedAddTeamMemberDialog: React.FC<EnhancedAddTeamMemberDialogProps> = ({
  open,
  onOpenChange,
  onTeamMemberAdded,
  teamId
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organizationRole: 'user' as UserRole,
    temporaryPassword: ''
  });

  const isSuperadmin = user?.role === 'superadmin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to add team members');
      return;
    }

    if (!user.organizationId) {
      toast.error('No organization found. Please contact your administrator.');
      return;
    }

    setIsLoading(true);

    try {
      // For superadmins, create a new user in the organization
      if (isSuperadmin) {
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: formData.email.toLowerCase(),
            name: formData.name,
            role: formData.organizationRole,
            temporaryPassword: formData.temporaryPassword,
            organizationId: user.organizationId
          }
        });

        if (error) {
          console.error('Error creating user:', error);
          toast.error('Failed to create user: ' + error.message);
          return;
        }

        if (!data?.success) {
          toast.error(data?.error || 'Failed to create user');
          return;
        }

        // If a team ID is provided, add the user to the team
        if (teamId && data.user?.id) {
          const { error: teamError } = await supabase
            .from('team_memberships')
            .insert({
              team_id: teamId,
              user_id: data.user.id,
              role: 'member'
            });

          if (teamError) {
            console.error('Error adding user to team:', teamError);
            toast.error('User created but failed to add to team');
          }
        }

        toast.success(`User created successfully with ${formData.organizationRole} role`);
      } else {
        // For non-superadmins, add to team_members table (legacy functionality)
        const { error } = await supabase
          .from('team_members')
          .insert({
            name: formData.name,
            email: formData.email.toLowerCase(),
            role: 'user', // Non-superadmins can only create basic users
            manager_id: user.id,
            organization_id: user.organizationId
          });

        if (error) {
          console.error('Error adding team member:', error);
          toast.error('Failed to add team member: ' + error.message);
          return;
        }

        toast.success('Team member added successfully');
      }

      setFormData({ 
        name: '', 
        email: '', 
        organizationRole: 'user',
        temporaryPassword: ''
      });
      onTeamMemberAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, temporaryPassword: password }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isSuperadmin ? 'Create New User' : 'Add Team Member'}
          </DialogTitle>
          <DialogDescription>
            {isSuperadmin 
              ? 'Create a new user account in your organization with the specified role and permissions.'
              : 'Add a new member to your team. They will be able to be assigned tasks and collaborate on projects.'
            }
          </DialogDescription>
        </DialogHeader>

        {isSuperadmin && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              As a superadmin, you can create new users and set their organization-wide roles.
              The user will receive login credentials via email.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          {isSuperadmin && (
            <>
              <OrganizationRoleSelector
                value={formData.organizationRole}
                onValueChange={(role) => handleInputChange('organizationRole', role)}
                label="Organization Role"
                placeholder="Select organization role"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomPassword}
                  >
                    Generate
                  </Button>
                </div>
                <Input
                  id="password"
                  type="text"
                  value={formData.temporaryPassword}
                  onChange={(e) => handleInputChange('temporaryPassword', e.target.value)}
                  placeholder="Enter temporary password"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The user will be required to change this password on first login.
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSuperadmin ? 'Create User' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddTeamMemberDialog;
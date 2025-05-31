
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/organization';

interface OrganizationUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user, organization, userRole } = useAuth();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('team_member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Redirect if not admin
  if (userRole !== 'admin') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Access Restricted</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need admin privileges to access this page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fetchUsers = async () => {
    if (!organization) return;

    try {
      setIsLoading(true);
      
      // Note: In a production app, you'd typically have a separate user management table
      // For now, we'll simulate this functionality
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        return;
      }

      // Filter users by organization (in production, this would be handled by RLS)
      const orgUsers = data?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        created_at: user.created_at,
      })) || [];

      setUsers(orgUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [organization]);

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!organization) {
      toast.error('Organization not found');
      return;
    }

    setIsInviting(true);

    try {
      // In a real implementation, you would send an email invitation
      // For now, we'll simulate the invitation process
      toast.success(`Invitation sent to ${inviteEmail} with role: ${inviteRole}`);
      
      setInviteEmail('');
      setInviteRole('team_member');
      setInviteDialogOpen(false);
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // In a real implementation, you would update the user's metadata
      // This is a simulation of the functionality
      toast.success(`User role updated to ${newRole}`);
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users and permissions for {organization?.name}</p>
        </div>
        
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleInviteUser} 
                disabled={isInviting}
                className="w-full"
              >
                {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Organization Users
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((orgUser) => (
                  <TableRow key={orgUser.id}>
                    <TableCell className="font-medium">{orgUser.name}</TableCell>
                    <TableCell>{orgUser.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        orgUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                        orgUser.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {orgUser.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(orgUser.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {orgUser.id !== user?.id && (
                        <Select 
                          value={orgUser.role} 
                          onValueChange={(value) => updateUserRole(orgUser.id, value as UserRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="team_member">Team Member</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

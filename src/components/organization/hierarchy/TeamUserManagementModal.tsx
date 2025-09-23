import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Crown,
  Shield,
  User,
  Trash2,
  ArrowRightLeft,
  Building2,
  Briefcase
} from 'lucide-react';
import { useUserJobRoles } from '@/hooks/useUserJobRoles';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface TeamUserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: 'manager' | 'member' | 'admin';
    systemRole: string;
    team_id: string;
    team_name: string;
  } | null;
  allTeamMemberships?: Array<{
    team_id: string;
    team_name: string;
    role: 'manager' | 'member' | 'admin';
  }>;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'manager':
      return <Crown className="h-4 w-4 text-amber-500" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'member':
      return <User className="h-4 w-4 text-emerald-500" />;
    default:
      return <User className="h-4 w-4 text-muted-foreground" />;
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'manager':
      return 'default';
    case 'admin':
      return 'destructive';
    case 'member':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const TeamUserManagementModal: React.FC<TeamUserManagementModalProps> = ({
  open,
  onOpenChange,
  user,
  allTeamMemberships = []
}) => {
  const { user: currentUser } = useAuth();
  const { userJobRoles } = useUserJobRoles(user?.id || '');
  const { removeTeamMember, updateTeamMemberRole, addTeamMember } = useTeamManagement();
  const { teams } = useTeamsByOrganization(currentUser?.organizationId);
  
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedTargetTeam, setSelectedTargetTeam] = useState<string>('');
  const [selectedNewRole, setSelectedNewRole] = useState<'manager' | 'member' | 'admin'>('member');

  if (!user) return null;

  const handleRemoveFromTeam = async () => {
    if (!user) return;
    
    setIsRemoving(true);
    try {
      await removeTeamMember(user.team_id, user.id);
      toast({
        title: "Success",
        description: `${user.name} has been removed from ${user.team_name}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user from team",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRoleChange = async (newRole: 'manager' | 'member' | 'admin') => {
    if (!user || newRole === user.role) return;
    
    setIsUpdating(true);
    try {
      await updateTeamMemberRole(user.team_id, user.id, newRole);
      toast({
        title: "Success",
        description: `${user.name}'s role has been updated to ${newRole}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransferToTeam = async () => {
    if (!user || !selectedTargetTeam) return;
    
    setIsTransferring(true);
    try {
      // Remove from current team
      await removeTeamMember(user.team_id, user.id);
      
      // Add to target team
      await addTeamMember(selectedTargetTeam, user.id, selectedNewRole);
      
      const targetTeam = teams.find(t => t.id === selectedTargetTeam);
      toast({
        title: "Success",
        description: `${user.name} has been transferred to ${targetTeam?.name || 'the selected team'}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer user to team",
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const availableTeamsForTransfer = teams.filter(team => 
    team.id !== user.team_id && 
    !allTeamMemberships.some(membership => membership.team_id === team.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manage Team Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {user.systemRole}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Team */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Current Team</span>
            </div>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{user.team_name}</span>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                    {getRoleIcon(user.role)}
                    <span className="ml-1 capitalize">{user.role}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Team Memberships */}
          {allTeamMemberships.length > 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">All Teams ({allTeamMemberships.length})</span>
              </div>
              <div className="space-y-2">
                {allTeamMemberships.map(membership => (
                  <Card key={membership.team_id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{membership.team_name}</span>
                        <Badge variant={getRoleBadgeVariant(membership.role)} className="text-xs">
                          {getRoleIcon(membership.role)}
                          <span className="ml-1 capitalize">{membership.role}</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Job Roles */}
          {userJobRoles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Job Roles</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userJobRoles.map(ujr => (
                  <Badge key={ujr.id} variant="secondary" className="text-xs">
                    {ujr.job_role?.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            <h4 className="font-medium">Actions</h4>
            
            {/* Change Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Change Role in {user.team_name}</label>
              <div className="flex gap-2">
                <Select
                  value={user.role}
                  onValueChange={handleRoleChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transfer to Team */}
            {availableTeamsForTransfer.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Transfer to Another Team</label>
                <div className="flex gap-2">
                  <Select
                    value={selectedTargetTeam}
                    onValueChange={setSelectedTargetTeam}
                    disabled={isTransferring}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select target team" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeamsForTransfer.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedNewRole}
                    onValueChange={(value) => setSelectedNewRole(value as 'manager' | 'member' | 'admin')}
                    disabled={isTransferring}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleTransferToTeam}
                  disabled={!selectedTargetTeam || isTransferring}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {isTransferring ? 'Transferring...' : 'Transfer'}
                </Button>
              </div>
            )}

            {/* Remove from Team */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isRemoving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {user.name} from {user.team_name}? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveFromTeam}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
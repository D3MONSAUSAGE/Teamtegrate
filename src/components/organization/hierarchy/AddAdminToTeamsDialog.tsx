import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Search, 
  UserPlus, 
  Loader2,
  Shield,
  Crown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/components/ui/sonner';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface TeamSelection {
  teamId: string;
  role: 'manager' | 'member' | 'admin';
}

interface AddAdminToTeamsDialogProps {
  admin: OrganizationUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdminAdded: () => void;
}

const AddAdminToTeamsDialog: React.FC<AddAdminToTeamsDialogProps> = ({
  admin,
  open,
  onOpenChange,
  onAdminAdded,
}) => {
  const { teams, isLoading: teamsLoading } = useTeamAccess();
  const { bulkAddTeamMembers } = useTeamMemberOperations();
  const { teamMembers } = useRealTeamMembers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<Map<string, 'manager' | 'member' | 'admin'>>(new Map());
  const [defaultRole, setDefaultRole] = useState<'manager' | 'member' | 'admin'>(
    admin?.role === 'superadmin' || admin?.role === 'admin' ? 'admin' : 'member'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens/closes or admin changes
  useEffect(() => {
    if (open && admin) {
      setSelectedTeams(new Map());
      setSearchTerm('');
      setDefaultRole(admin.role === 'superadmin' || admin.role === 'admin' ? 'admin' : 'member');
    }
  }, [open, admin]);

  if (!admin) return null;

  // Get teams where admin is NOT already a member
  const adminTeamMemberships = teamMembers.filter(member => member.id === admin.id);
  const adminTeamIds = new Set(adminTeamMemberships.map(m => m.team_id));
  
  const availableTeams = teams.filter(team => !adminTeamIds.has(team.id));

  const filteredTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTeamToggle = (teamId: string) => {
    const newSelected = new Map(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.set(teamId, defaultRole);
    }
    setSelectedTeams(newSelected);
  };

  const handleRoleChange = (teamId: string, role: 'manager' | 'member' | 'admin') => {
    const newSelected = new Map(selectedTeams);
    newSelected.set(teamId, role);
    setSelectedTeams(newSelected);
  };

  const handleAddToTeams = async () => {
    if (selectedTeams.size === 0) {
      toast.error('Please select at least one team');
      return;
    }

    setIsSubmitting(true);
    try {
      // Add admin to each selected team with their specific role
      const addPromises = Array.from(selectedTeams.entries()).map(([teamId, role]) =>
        bulkAddTeamMembers(teamId, [{
          userId: admin.id,
          role,
          // Give system role override for admins/superadmins being added as team admins
          systemRoleOverride: (admin.role === 'superadmin' || admin.role === 'admin') && role === 'admin' 
            ? admin.role 
            : undefined
        }])
      );

      await Promise.all(addPromises);

      toast.success(`Successfully added ${admin.name} to ${selectedTeams.size} team(s)`);
      setSelectedTeams(new Map());
      setSearchTerm('');
      onAdminAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding admin to teams:', error);
      toast.error('Failed to add admin to teams');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedTeams.size === filteredTeams.length) {
      setSelectedTeams(new Map());
    } else {
      const newSelected = new Map();
      filteredTeams.forEach(team => {
        newSelected.set(team.id, defaultRole);
      });
      setSelectedTeams(newSelected);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add {admin.name} to Teams
            <Badge variant="outline" className="ml-2">
              {admin.role === 'superadmin' ? <Crown className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
              {admin.role}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={defaultRole} onValueChange={(value: 'manager' | 'member' | 'admin') => setDefaultRole(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Team Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredTeams.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedTeams.size === filteredTeams.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({filteredTeams.length})
                </label>
                {selectedTeams.size > 0 && (
                  <Badge variant="secondary">
                    {selectedTeams.size} selected
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Current Memberships */}
          {adminTeamMemberships.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Current Team Memberships:</h4>
              <div className="flex flex-wrap gap-1">
                {adminTeamMemberships.map(membership => (
                  <Badge key={membership.team_id} variant="outline" className="text-xs">
                    {membership.team_name} ({membership.role})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Teams List */}
          <div className="flex-1 overflow-y-auto">
            {teamsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading available teams...</span>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'No teams found matching your search.' 
                    : 'Admin is already a member of all available teams.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTeams.map((team) => {
                  const isSelected = selectedTeams.has(team.id);
                  const selectedRole = selectedTeams.get(team.id) || defaultRole;
                  
                  return (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleTeamToggle(team.id)}
                      />
                      <div className="flex-1 cursor-pointer" onClick={() => handleTeamToggle(team.id)}>
                        <div className="font-medium">{team.name}</div>
                        {team.description && (
                          <div className="text-sm text-muted-foreground">{team.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {team.member_count} members
                        </div>
                      </div>
                      {isSelected && (
                        <Select
                          value={selectedRole}
                          onValueChange={(value: 'manager' | 'member' | 'admin') => handleRoleChange(team.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Team Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddToTeams} 
              disabled={selectedTeams.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add to {selectedTeams.size > 0 ? `${selectedTeams.size} ` : ''}Team{selectedTeams.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAdminToTeamsDialog;
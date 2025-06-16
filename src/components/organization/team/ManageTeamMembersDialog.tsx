
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Plus, 
  Trash2, 
  Crown,
  User,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { Team } from '@/types/teams';
import AddTeamMemberDialog from './AddTeamMemberDialog';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'manager' | 'member';
  joined_at: string;
  user_name: string;
  user_email: string;
}

interface ManageTeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

const ManageTeamMembersDialog: React.FC<ManageTeamMembersDialogProps> = ({
  open,
  onOpenChange,
  team,
}) => {
  const { user } = useAuth();
  const { removeTeamMember } = useTeamManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch team members with improved error handling
  const { data: teamMembers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['team-members', team?.id],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!team?.id) {
        console.log('No team ID provided');
        return [];
      }
      
      console.log('Fetching team members for team:', team.id);
      
      try {
        const { data, error } = await supabase
          .from('team_memberships')
          .select(`
            id,
            user_id,
            role,
            joined_at,
            users!inner(name, email)
          `)
          .eq('team_id', team.id);

        if (error) {
          console.error('Error fetching team members:', error);
          throw error;
        }
        
        console.log('Raw team memberships data:', data);
        
        const formattedMembers = (data || []).map(membership => ({
          id: membership.id,
          user_id: membership.user_id,
          role: membership.role as 'manager' | 'member',
          joined_at: membership.joined_at,
          user_name: (membership.users as any)?.name || 'Unknown',
          user_email: (membership.users as any)?.email || 'Unknown',
        }));
        
        console.log('Formatted team members:', formattedMembers);
        return formattedMembers;
      } catch (error) {
        console.error('Error in team members query:', error);
        throw error;
      }
    },
    enabled: !!team?.id && open,
  });

  const canManage = user?.role && ['superadmin', 'admin'].includes(user.role);

  const filteredMembers = teamMembers.filter(member =>
    member.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveMember = async () => {
    if (!memberToRemove || !team) return;
    
    setIsRemoving(true);
    try {
      await removeTeamMember(team.id, memberToRemove.user_id);
      refetch();
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing team member:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleMemberAdded = () => {
    refetch();
    setAddMemberDialogOpen(false);
  };

  if (!team) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Team Members - {team.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search and Add Section */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {canManage && (
                <Button onClick={() => setAddMemberDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              )}
            </div>

            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                Debug: Total members: {teamMembers.length}, Filtered: {filteredMembers.length}, 
                Team: {team.id}, Loading: {isLoading.toString()}, Error: {error?.message || 'none'}
              </div>
            )}

            {/* Members List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading team members...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Error loading team members</p>
                  <p className="text-xs mt-1">{error.message}</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                    Try Again
                  </Button>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No members in this team yet.</p>
                  {canManage && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAddMemberDialogOpen(true)}
                      className="mt-2"
                    >
                      Add First Member
                    </Button>
                  )}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No members found matching "{searchTerm}"</p>
                  <p className="text-xs mt-1">Try different search terms</p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {member.role === 'manager' ? (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <User className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.user_name}</span>
                          <Badge variant={member.role === 'manager' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.user_email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Summary */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Total members: {teamMembers.length} | 
                Managers: {teamMembers.filter(m => m.role === 'manager').length} | 
                Members: {teamMembers.filter(m => m.role === 'member').length}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <AddTeamMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        team={team}
        onMemberAdded={handleMemberAdded}
        existingMemberIds={teamMembers.map(m => m.user_id)}
      />

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user_name} from the team "{team.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageTeamMembersDialog;

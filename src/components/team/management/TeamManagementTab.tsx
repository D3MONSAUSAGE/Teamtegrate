import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Search, 
  Settings, 
  UserPlus,
  Crown,
  Shield,
  User,
  MessageSquarePlus,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import { useUnassignedUsers } from '@/hooks/team/useUnassignedUsers';
import { Team } from '@/types/teams';
import { toast } from '@/components/ui/sonner';
import TeamMemberCard from './TeamMemberCard';
import AddTeamMemberDialog from '@/components/AddTeamMemberDialog';
import EnhancedCreateRoomDialog from '@/components/chat/EnhancedCreateRoomDialog';
import { useRooms } from '@/hooks/useRooms';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'manager' | 'team_leader' | 'member';
  job_roles?: string[];
  joined_at: string;
  totalTasks?: number;
  completedTasks?: number;
  completionRate?: number;
}

interface TeamWithMembers extends Team {
  members: TeamMember[];
}

interface TeamManagementTabProps {
  selectedTeam: Team;
}

const TeamManagementTab: React.FC<TeamManagementTabProps> = ({ selectedTeam }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addTeamMember, removeTeamMember } = useTeamManagement();
  const { teamMembers: realTeamMembers, isLoading: membersLoading } = useRealTeamMembers(selectedTeam.id);
  const { unassignedUsers, isLoading: unassignedLoading } = useUnassignedUsers();
  const { createRoom } = useRooms();
  
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showCreateChatDialog, setShowCreateChatDialog] = useState(false);

  // Convert real team members to component format
  const convertedMembers: TeamMember[] = realTeamMembers.map(member => ({
    id: member.id,
    name: member.name,
    email: member.email,
    avatar_url: member.avatar_url,
    role: member.role === 'manager' ? 'manager' : 'member', // DB has no team_leader
    joined_at: member.joined_at,
    totalTasks: member.totalTasks,
    completedTasks: member.completedTasks,
    completionRate: member.completionRate,
  }));

  useEffect(() => {
    if (selectedTeam && !membersLoading) {
      setTeam({
        ...selectedTeam,
        members: convertedMembers
      });
    }
  }, [selectedTeam, convertedMembers, membersLoading]);

  const canManageTeam = user && (
    ['superadmin', 'admin'].includes(user.role) || 
    team?.manager_id === user.id
  );

  const filteredMembers = team?.members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  }) || [];

  const handleRoleChange = async (memberId: string, newRole: 'manager' | 'team_leader' | 'member') => {
    try {
      // Update member role in state optimistically
      if (team) {
        const updatedMembers = team.members.map(member =>
          member.id === memberId ? { ...member, role: newRole } : member
        );
        setTeam({ ...team, members: updatedMembers });
      }
      
      toast.success(`Role updated successfully`);
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeTeamMember(selectedTeam.id, memberId);
      if (team) {
        const updatedMembers = team.members.filter(member => member.id !== memberId);
        setTeam({ ...team, members: updatedMembers });
      }
      toast.success('Member removed from team');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleCreateTeamChat = () => {
    setShowCreateChatDialog(true);
  };

  const handleAddMember = () => {
    setShowAddMemberDialog(true);
  };

  const handleBulkAddMembers = () => {
    toast.success('Bulk add members feature coming soon');
  };

  const handleTeamSettings = () => {
    toast.success('Team settings feature coming soon');
  };

  const handleCreateRoom = async (name: string, description?: string, isPublic = false, selectedTeamId?: string) => {
    try {
      const room = await createRoom(name, description, isPublic);
      setShowCreateChatDialog(false);
      if (room) {
        toast.success('Team chat room created successfully!');
        navigate(`/dashboard/chat`);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create team chat room');
    }
  };

  const handleAddUnassignedToTeam = async (userId: string) => {
    try {
      await addTeamMember(selectedTeam.id, userId, 'member');
      // Optimistically update UI
      const userToAdd = unassignedUsers.find(u => u.id === userId);
      if (team && userToAdd) {
        setTeam({
          ...team,
          members: [
            ...team.members,
            {
              id: userToAdd.id,
              name: userToAdd.name,
              email: userToAdd.email,
              avatar_url: userToAdd.avatar_url || undefined,
              role: 'member',
              joined_at: new Date().toISOString(),
            }
          ]
        });
      }
      toast.success('User added to team');
    } catch (e) {
      toast.error('Failed to add user to team');
    }
  };

  if (membersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Team not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{team.name}</h2>
          <p className="text-muted-foreground">{team.description || 'Team Management'}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {canManageTeam && (
            <>
              <Button 
                variant="outline" 
                onClick={handleCreateTeamChat}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Create Team Chat
              </Button>
              <Button 
                onClick={handleAddMember}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Team Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                  <Badge variant="outline">{filteredMembers.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="manager">Managers</SelectItem>
                      <SelectItem value="team_leader">Team Leaders</SelectItem>
                      <SelectItem value="member">Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={{
                    ...member,
                    tasksCompleted: member.completedTasks,
                    totalTasks: member.totalTasks
                  }}
                  canManage={canManageTeam}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemoveMember}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Name</p>
                <p className="font-medium">{team.name}</p>
              </div>
              
              {team.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{team.description}</p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manager</p>
                <p className="font-medium">{team.manager_name || 'Not assigned'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Members</p>
                <p className="font-medium">{team.member_count}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(team.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Unassigned People */}
          {canManageTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unassigned People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {unassignedLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : unassignedUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Everyone is assigned to a team.</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{unassignedUsers.length} not in any team</p>
                    <div className="space-y-2">
                      {unassignedUsers.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleAddUnassignedToTeam(u.id)}>
                            <UserPlus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {canManageTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleBulkAddMembers}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Bulk Add Members
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleCreateTeamChat}
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Create Team Chat
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleTeamSettings}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Team Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Member Dialog */}
      <AddTeamMemberDialog
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
        onTeamMemberAdded={() => {
          setShowAddMemberDialog(false);
          toast.success('Team member added successfully');
        }}
        teamId={selectedTeam.id}
      />
      
      {/* Create Team Chat Dialog */}
      <EnhancedCreateRoomDialog
        open={showCreateChatDialog}
        onOpenChange={setShowCreateChatDialog}
        onCreateRoom={handleCreateRoom}
        preselectedTeamId={selectedTeam.id}
      />
    </div>
  );
};

export default TeamManagementTab;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Users, 
  Search, 
  Settings, 
  UserPlus,
  Crown,
  Shield,
  User,
  MoreVertical,
  MessageSquarePlus,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useRealTeamMembers, TeamMemberPerformanceData } from '@/hooks/team/useRealTeamMembers';
import { Team } from '@/types/teams';
import { toast } from '@/components/ui/sonner';

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

const DedicatedTeamManagement: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, addTeamMember, removeTeamMember } = useTeamManagement();
  const { teamMembers: realTeamMembers, isLoading: membersLoading, error } = useRealTeamMembers(teamId);
  
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Convert real team members to component format
  const convertedMembers: TeamMember[] = realTeamMembers.map(member => ({
    id: member.id,
    name: member.name,
    email: member.email,
    avatar_url: member.avatar_url,
    role: member.role === 'manager' ? 'manager' : 'member', // Convert from DB format
    joined_at: member.joined_at,
    totalTasks: member.totalTasks,
    completedTasks: member.completedTasks,
    completionRate: member.completionRate,
  }));

  useEffect(() => {
    // Find the team and load its members
    const foundTeam = teams.find(t => t.id === teamId);
    if (foundTeam && !membersLoading) {
      setTeam({
        ...foundTeam,
        members: convertedMembers
      });
    }
  }, [teamId, teams, convertedMembers, membersLoading]);

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'team_leader':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'manager':
        return 'default';
      case 'team_leader':
        return 'secondary';
      default:
        return 'outline';
    }
  };

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
      await removeTeamMember(teamId!, memberId);
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
    // Navigate to chat creation with team context
    navigate('/dashboard/chat?createTeamChat=true&teamId=' + teamId);
  };

  if (membersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/team')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Team not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/team')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground">{team.description || 'Team Management'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canManageTeam && (
            <>
              <Button variant="outline" onClick={handleCreateTeamChat}>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Create Team Chat
              </Button>
              <Button>
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
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{member.name}</h3>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                          {getRoleIcon(member.role)}
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      {member.totalTasks !== undefined && (
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Tasks: {member.completedTasks}/{member.totalTasks}
                          </Badge>
                          {member.completionRate !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {member.completionRate}% Complete
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageTeam && member.role !== 'manager' && (
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value as any)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {canManageTeam && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
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

          {/* Quick Actions */}
          {canManageTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Bulk Add Members
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Create Team Chat
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Team Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DedicatedTeamManagement;
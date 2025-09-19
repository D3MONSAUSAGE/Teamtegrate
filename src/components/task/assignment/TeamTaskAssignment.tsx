import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, UserCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Team {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
  manager_name?: string;
  is_active: boolean;
}

interface TeamTaskAssignmentProps {
  selectedTeamId: string;
  selectedTeamName: string;
  onTeamSelect: (teamId: string, teamName: string) => void;
  organizationId: string;
}

const TeamTaskAssignment: React.FC<TeamTaskAssignmentProps> = ({
  selectedTeamId,
  selectedTeamName,
  onTeamSelect,
  organizationId
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [organizationId]);

  useEffect(() => {
    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeams(filtered);
  }, [teams, searchTerm]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          is_active,
          manager_id,
          users!teams_manager_id_fkey(name, email),
          team_memberships(count)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const teamsWithCounts = data?.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        is_active: team.is_active,
        member_count: team.team_memberships?.[0]?.count || 0,
        manager_name: team.users?.name || team.users?.email || 'No Manager'
      })) || [];

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          user_id,
          users!team_memberships_user_id_fkey(
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      const members = data?.map(membership => membership.users).filter(Boolean) || [];
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const handleTeamSelect = (team: Team) => {
    onTeamSelect(team.id, team.name);
    setShowTeamDetails(true);
  };

  const handleTeamDeselect = () => {
    onTeamSelect('', '');
    setShowTeamDetails(false);
    setTeamMembers([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading teams...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!selectedTeamId ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Teams List */}
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredTeams.length > 0 ? (
                    filteredTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer"
                        onClick={() => handleTeamSelect(team)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {team.member_count} members • Manager: {team.manager_name}
                            </div>
                            {team.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {team.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {team.member_count} members
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No teams found matching your search' : 'No teams available'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Selected Team Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <UserCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedTeamName}</div>
                    <div className="text-sm text-muted-foreground">
                      Selected for assignment
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTeamDeselect}
                >
                  Change Team
                </Button>
              </div>

              {/* Team Members Preview */}
              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Team Members ({teamMembers.length}):</div>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {teamMembers.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {(member.name || member.email).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <div className="font-medium">{member.name || member.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Assigning to team will make this task visible to all team members</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamTaskAssignment;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Settings, 
  UserPlus,
  ChevronRight,
  Shield,
  Crown,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Team } from '@/types/teams';
import TeamManagementTab from '../management/TeamManagementTab';

interface TeamMemberWithRole {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'manager' | 'team_leader' | 'member';
}

interface ExtendedTeam extends Team {
  members: TeamMemberWithRole[];
}

const TeamOverviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, teamStats, isLoading, error } = useTeamManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const canManageTeams = user && ['superadmin', 'admin'].includes(user.role);

  const filteredTeams = teams.filter((team: Team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
    setActiveTab('manage');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'team_leader':
        return <Shield className="h-3 w-3 text-blue-600" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team Overview</h1>
          <Button disabled>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Overview</h1>
          <p className="text-muted-foreground">Manage your organization's teams and members</p>
        </div>
        {canManageTeams && (
          <Button onClick={() => navigate('/dashboard/team/create')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage" disabled={!selectedTeam}>
            {selectedTeam ? `Manage ${selectedTeam.name}` : 'Manage Team'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Team Statistics */}
      {teamStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                  <p className="text-2xl font-bold">{teamStats.total_teams}</p>
                </div>
                <Users className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-bold">{teamStats.total_team_members}</p>
                </div>
                <UserPlus className="h-8 w-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teams with Managers</p>
                  <p className="text-2xl font-bold">{teamStats.teams_with_managers}</p>
                </div>
                <Crown className="h-8 w-8 text-yellow-500/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Team Size</p>
                  <p className="text-2xl font-bold">{Math.round(teamStats.average_team_size)}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams
              <Badge variant="outline">{filteredTeams.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No teams found matching your search.' : 'No teams created yet.'}
              </p>
              {canManageTeams && !searchTerm && (
                <Button 
                  onClick={() => navigate('/dashboard/team/create')}
                  className="mt-4"
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((team: Team) => (
                <Card 
                  key={team.id} 
                  className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary"
                  onClick={() => handleTeamClick(team)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {team.member_count} members
                        </Badge>
                        {team.manager_name && (
                          <Badge variant="secondary" className="text-xs">
                            Manager: {team.manager_name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Member Avatars Preview */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {/* This would show actual member avatars - placeholder for now */}
                        {[...Array(Math.min(team.member_count, 3))].map((_, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {team.name.charAt(0)}{i + 1}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.member_count > 3 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium border-2 border-background">
                            +{team.member_count - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        Click to manage →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="manage">
          {selectedTeam ? (
            <TeamManagementTab selectedTeam={selectedTeam} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Select a team to manage</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamOverviewDashboard;
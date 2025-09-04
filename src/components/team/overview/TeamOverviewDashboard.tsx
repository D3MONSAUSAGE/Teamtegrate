import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/enhanced-card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamMemberSkeleton, TeamAnalyticsSkeleton } from '@/components/ui/enhanced-skeleton';
import PullToRefresh from '@/components/ui/pull-to-refresh';
import SmoothThemeTransition from '@/components/ui/smooth-theme-transition';
import ScreenReaderOnly from '@/components/accessibility/ScreenReaderOnly';
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
import CreateTeamDialog from '@/components/organization/team/CreateTeamDialog';

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
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);

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

  const handleRefresh = async () => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    // Simulate refresh - in real app this would reload data
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  if (isLoading) {
    return (
      <SmoothThemeTransition>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted animate-shimmer rounded" />
              <div className="h-4 w-64 bg-muted animate-shimmer rounded" />
            </div>
            <div className="h-10 w-32 bg-muted animate-shimmer rounded" />
          </div>
          <TeamAnalyticsSkeleton />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <TeamMemberSkeleton key={i} />
            ))}
          </div>
        </div>
      </SmoothThemeTransition>
    );
  }

  return (
    <SmoothThemeTransition>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        <div className="space-y-6 animate-fade-in">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Team Overview</h1>
              <p className="text-muted-foreground">Manage your organization's teams and members</p>
              <ScreenReaderOnly>
                Team management dashboard with {teams.length} teams and overview statistics
              </ScreenReaderOnly>
            </div>
            {canManageTeams && (
              <Button 
                onClick={() => setShowCreateTeamDialog(true)}
                className="mobile-touch-target"
                aria-label="Create new team"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="mobile-optimized">
              <TabsTrigger value="overview" className="mobile-touch-target">
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="manage" 
                disabled={!selectedTeam}
                className="mobile-touch-target"
                aria-label={selectedTeam ? `Manage team: ${selectedTeam.name}` : 'No team selected'}
              >
                {selectedTeam ? `Manage ${selectedTeam.name}` : 'Manage Team'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">

          {/* Team Statistics */}
          {teamStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="elevated" hover="glow" className="animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                      <p className="text-2xl font-bold">{teamStats.total_teams}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary/60" aria-hidden="true" />
                  </div>
                  <ScreenReaderOnly>
                    Your organization has {teamStats.total_teams} teams in total
                  </ScreenReaderOnly>
                </CardContent>
              </Card>
              
              <Card variant="elevated" hover="glow" className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                      <p className="text-2xl font-bold">{teamStats.total_team_members}</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-success/60" aria-hidden="true" />
                  </div>
                  <ScreenReaderOnly>
                    {teamStats.total_team_members} active team members across all teams
                  </ScreenReaderOnly>
                </CardContent>
              </Card>
              
              <Card variant="elevated" hover="glow" className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Teams with Managers</p>
                      <p className="text-2xl font-bold">{teamStats.teams_with_managers}</p>
                    </div>
                    <Crown className="h-8 w-8 text-warning/60" aria-hidden="true" />
                  </div>
                  <ScreenReaderOnly>
                    {teamStats.teams_with_managers} teams have assigned managers
                  </ScreenReaderOnly>
                </CardContent>
              </Card>
              
              <Card variant="elevated" hover="glow" className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Team Size</p>
                      <p className="text-2xl font-bold">{Math.round(teamStats.average_team_size)}</p>
                    </div>
                    <Settings className="h-8 w-8 text-primary/60" aria-hidden="true" />
                  </div>
                  <ScreenReaderOnly>
                    Average team size is {Math.round(teamStats.average_team_size)} members
                  </ScreenReaderOnly>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filter */}
          <Card variant="interactive" hover="lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" aria-hidden="true" />
                  Teams
                  <Badge variant="outline" className="animate-bounce-in">
                    {filteredTeams.length}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      placeholder="Search teams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64 mobile-focus"
                      aria-label="Search teams by name or description"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTeams.length === 0 ? (
                <div className="text-center py-8 animate-fade-in">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No teams found matching your search.' : 'No teams created yet.'}
                  </p>
                  {canManageTeams && !searchTerm && (
                    <Button 
                      onClick={() => setShowCreateTeamDialog(true)}
                      className="mt-4 mobile-touch-target animate-bounce-in"
                      variant="outline"
                      aria-label="Create your first team"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Your First Team
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTeams.map((team: Team, index: number) => (
                    <Card 
                      key={team.id} 
                      variant="interactive"
                      hover="lift"
                      className="group animate-scale-in border-l-4 border-l-primary/20 hover:border-l-primary mobile-touch-target"
                      onClick={() => handleTeamClick(team)}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Manage team: ${team.name}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleTeamClick(team)
                        }
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">{team.name}</h3>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
                            </div>
                            {team.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {team.description}
                              </p>
                            )}
                            <ScreenReaderOnly>
                              Team {team.name} with {team.member_count} members. {team.description}
                            </ScreenReaderOnly>
                          </div>
                        </div>

                        {/* Team Stats */}
                        <div className="flex items-center justify-between text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs animate-scale-in">
                              {team.member_count} members
                            </Badge>
                            {team.manager_name && (
                              <Badge variant="secondary" className="text-xs animate-scale-in">
                                Manager: {team.manager_name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Member Avatars Preview */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(team.member_count, 3))].map((_, i) => (
                              <Avatar key={i} className="h-6 w-6 border-2 border-background animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                <AvatarFallback className="text-xs">
                                  {team.name.charAt(0)}{i + 1}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {team.member_count > 3 && (
                              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium border-2 border-background animate-scale-in">
                                +{team.member_count - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground ml-2 group-hover:text-foreground transition-colors duration-200">
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
                <Card variant="elevated">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Select a team to manage</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Create Team Dialog */}
          <CreateTeamDialog
            open={showCreateTeamDialog}
            onOpenChange={setShowCreateTeamDialog}
          />
        </div>
      </PullToRefresh>
    </SmoothThemeTransition>
  );
};

export default TeamOverviewDashboard;
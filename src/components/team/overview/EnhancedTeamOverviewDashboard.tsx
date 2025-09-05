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
  Crown,
  Shield,
  User,
  MessageSquarePlus,
  Edit,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const EnhancedTeamOverviewDashboard: React.FC = () => {
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

  const handleTeamManage = (team: Team) => {
    setSelectedTeam(team);
    setActiveTab('manage');
  };

  const handleTeamView = (team: Team) => {
    navigate(`/dashboard/team/${team.id}`);
  };

  const handleQuickAddMember = (team: Team) => {
    setSelectedTeam(team);
    setActiveTab('manage');
    // TODO: Open add member dialog immediately
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Crown className="h-3 w-3 text-warning" />;
      case 'team_leader':
        return <Shield className="h-3 w-3 text-info" />;
      default:
        return <User className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const handleRefresh = async () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
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
          {/* Enhanced Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Team Management Center</h1>
              <p className="text-muted-foreground">Streamline your team operations and member management</p>
              <ScreenReaderOnly>
                Team management dashboard with {teams.length} teams and comprehensive management tools
              </ScreenReaderOnly>
            </div>
            {canManageTeams && (
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dashboard/team-analytics')}
                  className="mobile-touch-target"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button 
                  onClick={() => setShowCreateTeamDialog(true)}
                  className="mobile-touch-target"
                  aria-label="Create new team"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="mobile-optimized">
              <TabsTrigger value="overview" className="mobile-touch-target">
                <Activity className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="manage" 
                disabled={!selectedTeam}
                className="mobile-touch-target"
                aria-label={selectedTeam ? `Manage team: ${selectedTeam.name}` : 'No team selected'}
              >
                <Settings className="h-4 w-4 mr-2" />
                {selectedTeam ? `Managing: ${selectedTeam.name}` : 'Team Management'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Enhanced Team Statistics */}
              {teamStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card variant="elevated" hover="glow" className="animate-scale-in">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                          <p className="text-2xl font-bold text-primary">{teamStats.total_teams}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Active organizational teams</p>
                    </CardContent>
                  </Card>
                  
                  <Card variant="elevated" hover="glow" className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                          <p className="text-2xl font-bold text-success">{teamStats.total_team_members}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                          <UserPlus className="h-6 w-6 text-success" aria-hidden="true" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Across all teams</p>
                    </CardContent>
                  </Card>
                  
                  <Card variant="elevated" hover="glow" className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Managed Teams</p>
                          <p className="text-2xl font-bold text-warning">{teamStats.teams_with_managers}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                          <Crown className="h-6 w-6 text-warning" aria-hidden="true" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Teams with assigned managers</p>
                    </CardContent>
                  </Card>
                  
                  <Card variant="elevated" hover="glow" className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Team Size</p>
                          <p className="text-2xl font-bold text-info">{Math.round(teamStats.average_team_size)}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
                          <Activity className="h-6 w-6 text-info" aria-hidden="true" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Members per team</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Enhanced Team Grid */}
              <Card variant="interactive" hover="lift">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" aria-hidden="true" />
                      Your Teams
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
                    <div className="text-center py-12 animate-fade-in">
                      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                        <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {searchTerm ? 'No teams found' : 'No teams yet'}
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {searchTerm 
                          ? 'Try adjusting your search terms to find the team you\'re looking for.' 
                          : 'Get started by creating your first team to organize your workspace.'}
                      </p>
                      {canManageTeams && !searchTerm && (
                        <Button 
                          onClick={() => setShowCreateTeamDialog(true)}
                          className="mobile-touch-target animate-bounce-in"
                          aria-label="Create your first team"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Your First Team
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredTeams.map((team: Team, index: number) => (
                        <Card 
                          key={team.id} 
                          variant="interactive"
                          hover="lift"
                          className="group animate-scale-in border-l-4 border-l-primary/20 hover:border-l-primary transition-all duration-300"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <CardContent className="p-6">
                            {/* Team Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">
                                  {team.name}
                                </h3>
                                {team.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {team.description}
                                  </p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleTeamView(team)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {canManageTeams && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleTeamManage(team)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Manage Team
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleQuickAddMember(team)}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add Member
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Team Stats */}
                            <div className="flex items-center gap-4 mb-4">
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {team.member_count} members
                              </Badge>
                              {team.manager_name && (
                                <Badge variant="secondary" className="text-xs">
                                  <Crown className="h-3 w-3 mr-1" />
                                  {team.manager_name}
                                </Badge>
                              )}
                            </div>

                            {/* Member Avatars */}
                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {[...Array(Math.min(team.member_count, 4))].map((_, i) => (
                                  <Avatar key={i} className="h-7 w-7 border-2 border-background animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <AvatarFallback className="text-xs">
                                      {team.name.charAt(0)}{i + 1}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {team.member_count > 4 && (
                                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-medium border-2 border-background">
                                    +{team.member_count - 4}
                                  </div>
                                )}
                              </div>
                              
                              {/* Primary Action Buttons */}
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleTeamView(team)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                {canManageTeams && (
                                  <Button 
                                    size="sm"
                                    onClick={() => handleTeamManage(team)}
                                  >
                                    <Settings className="h-3 w-3 mr-1" />
                                    Manage
                                  </Button>
                                )}
                              </div>
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

export default EnhancedTeamOverviewDashboard;
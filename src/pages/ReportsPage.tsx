import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/contexts/auth/hooks/useRoleAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import { AlertCircle, Users, TrendingUp, Clock, BookOpen, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PerformanceOverview } from '@/components/reports/PerformanceOverview';
import { TaskProjectReports } from '@/components/reports/TaskProjectReports';
import { TimeScheduleReports } from '@/components/reports/TimeScheduleReports';
import { TrainingReports } from '@/components/reports/TrainingReports';
import { TeamAnalytics } from '@/components/reports/TeamAnalytics';

export default function ReportsPage() {
  const { user } = useAuth();
  const { hasRoleAccess } = useRoleAccess(user);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('This Week');

  const { teams, isLoading: teamsLoading } = useTeamsByOrganization(user?.organizationId);
  const { teamMembers, isLoading: membersLoading } = useRealTeamMembers(selectedTeam);

  // Role-based access control
  const isManager = hasRoleAccess('manager');
  const isAdmin = hasRoleAccess('admin');
  const canViewReports = isManager || isAdmin;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in to access the reports dashboard.
            </p>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewReports) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need manager-level access or above to view performance reports.
            </p>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Your current role: {user.role}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact your administrator to request access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights for team performance management
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="Last Week">Last Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
                <SelectItem value="Last 7 days">Last 7 Days</SelectItem>
                <SelectItem value="Last 30 days">Last 30 Days</SelectItem>
                <SelectItem value="Last 90 days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Team and Member Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Team *</label>
                <Select 
                  value={selectedTeam} 
                  onValueChange={(value) => {
                    setSelectedTeam(value);
                    setSelectedMember(''); // Reset member selection when team changes
                  }}
                  disabled={teamsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={teamsLoading ? "Loading teams..." : "Select a team"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Member Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Team Member *</label>
                <Select 
                  value={selectedMember} 
                  onValueChange={setSelectedMember}
                  disabled={!selectedTeam || membersLoading}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !selectedTeam 
                          ? "First select a team" 
                          : membersLoading 
                            ? "Loading members..." 
                            : "Select a team member"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!selectedTeam && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select a team to begin viewing performance reports.
                </AlertDescription>
              </Alert>
            )}

            {selectedTeam && !selectedMember && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select a team member to view detailed performance data.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Reports Interface - Only show when team and member are selected */}
        {selectedTeam && selectedMember && (
          <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Tasks</span>
                </TabsTrigger>
                <TabsTrigger value="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Time</span>
                </TabsTrigger>
                <TabsTrigger value="training" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Training</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <PerformanceOverview
                  memberId={selectedMember}
                  teamId={selectedTeam}
                  timeRange={selectedTimeRange}
                />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                <TaskProjectReports
                  memberId={selectedMember}
                  teamId={selectedTeam}
                  timeRange={selectedTimeRange}
                />
              </TabsContent>

              <TabsContent value="time" className="space-y-6">
                <TimeScheduleReports
                  memberId={selectedMember}
                  teamId={selectedTeam}
                  timeRange={selectedTimeRange}
                />
              </TabsContent>

              <TabsContent value="training" className="space-y-6">
                <TrainingReports
                  memberId={selectedMember}
                  teamId={selectedTeam}
                  timeRange={selectedTimeRange}
                />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <TeamAnalytics
                  memberId={selectedMember}
                  teamId={selectedTeam}
                  timeRange={selectedTimeRange}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
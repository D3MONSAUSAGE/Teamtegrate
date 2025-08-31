import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { WeeklyDashboard } from '@/components/reports/weekly/WeeklyDashboard';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

const ReportsPage = () => {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  
  const { teams, isLoading: teamsLoading } = useTeamsByOrganization(user?.organizationId);
  const { users: allUsers, isLoading: usersLoading } = useOrganizationTeamMembers();
  
  // Check if user has admin+ access
  const isAdminOrAbove = user && hasRoleAccess(user.role, 'admin');
  
  // Filter team members based on selected team
  const teamMembers = useMemo(() => {
    if (!selectedTeamId || !allUsers) return [];
    
    // For now, return all users since we don't have direct team membership data
    // This should be replaced with actual team membership filtering
    return allUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email
    }));
  }, [selectedTeamId, allUsers]);
  
  // Reset member selection when team changes
  React.useEffect(() => {
    setSelectedMemberId('');
  }, [selectedTeamId]);
  
  // For non-admin users, auto-set their own ID
  React.useEffect(() => {
    if (user && !isAdminOrAbove) {
      setSelectedMemberId(user.id);
    }
  }, [user, isAdminOrAbove]);
  
  if (!user) {
    return (
      <Alert>
        <AlertDescription>Please log in to access reports.</AlertDescription>
      </Alert>
    );
  }
  
  if (!isAdminOrAbove) {
    // Regular users see their own data directly
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Performance Reports</h1>
          <p className="text-muted-foreground">
            Your personal performance analytics and weekly reports
          </p>
        </div>
        
        <WeeklyDashboard 
          selectedMemberId={user.id}
          selectedTeamId=""
          readOnly={false}
        />
      </div>
    );
  }
  
  // Admin+ users must select team and member
  const canShowReports = selectedTeamId && selectedMemberId;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive performance reports and analytics for your organization
        </p>
      </div>
      
      {/* Team and Member Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Team <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder={teamsLoading ? "Loading teams..." : "Choose a team (required)"} />
                </SelectTrigger>
                <SelectContent>
                  {teams.length === 0 && !teamsLoading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No teams found
                    </div>
                  ) : (
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex flex-col">
                          <span>{team.name}</span>
                          {team.description && (
                            <span className="text-xs text-muted-foreground">{team.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Member Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Select Team Member <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={selectedMemberId} 
                onValueChange={setSelectedMemberId}
                disabled={!selectedTeamId || usersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedTeamId 
                      ? "Select team first"
                      : usersLoading 
                        ? "Loading members..." 
                        : "Choose a team member (required)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.length === 0 && !usersLoading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No team members found
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex flex-col">
                          <span>{member.name}</span>
                          {member.email && (
                            <span className="text-xs text-muted-foreground">{member.email}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {!canShowReports && (
            <Alert>
              <AlertDescription>
                Please select both a team and team member to view performance reports.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Reports Section */}
      {canShowReports && (
        <WeeklyDashboard 
          selectedMemberId={selectedMemberId}
          selectedTeamId={selectedTeamId}
          readOnly={true}
        />
      )}
    </div>
  );
};

export default ReportsPage;
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Crown, Calendar, Building2 } from 'lucide-react';
import { ComprehensiveProfile } from '@/hooks/useEnhancedProfile';

interface TeamStructureSectionProps {
  profile: ComprehensiveProfile;
}

const TeamStructureSection: React.FC<TeamStructureSectionProps> = ({ profile }) => {
  const { user, manager, teams, directReports } = profile;

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'manager':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Team & Organization Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Role & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Organization Role</label>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </Badge>
              {user.job_title && (
                <span className="text-sm text-muted-foreground">• {user.job_title}</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Department</label>
            <div className="text-sm">
              {user.department || 'Not specified'}
            </div>
          </div>
        </div>

        {/* Manager Information */}
        {manager && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Reports To
            </h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={manager.avatar_url} />
                <AvatarFallback>{getInitials(manager.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{manager.name}</div>
                <div className="text-sm text-muted-foreground">{manager.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Team Memberships */}
        {teams.length > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Memberships
            </h4>
            <div className="space-y-3">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{team.name}</div>
                    {team.manager_name && (
                      <div className="text-sm text-muted-foreground">
                        Manager: {team.manager_name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{team.role}</Badge>
                    {team.joined_at && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(team.joined_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct Reports */}
        {directReports.length > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Direct Reports ({directReports.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {directReports.map((report) => (
                <div key={report.id} className="flex items-center gap-3 p-2 rounded border">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={report.avatar_url} />
                    <AvatarFallback className="text-xs">{getInitials(report.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{report.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{report.job_title || report.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Member Since</label>
            <div className="text-sm">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          {user.hire_date && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
              <div className="text-sm">
                {new Date(user.hire_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamStructureSection;
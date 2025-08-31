import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Calendar, TrendingUp } from 'lucide-react';
import { User as AppUser } from '@/types';

interface TeamMemberStats {
  userId: string;
  name: string;
  email: string;
  totalHours: number;
  scheduledHours: number;
  isActive: boolean;
  lastClockIn?: string;
  complianceIssues: number;
  overtimeHours: number;
}

interface TeamMembersGridViewProps {
  teamMembers: AppUser[];
  teamStats?: any[];
  isLoading?: boolean;
  onSelectMember: (userId: string) => void;
  weekDate: Date;
}

export const TeamMembersGridView: React.FC<TeamMembersGridViewProps> = ({
  teamMembers,
  teamStats = [],
  isLoading = false,
  onSelectMember,
  weekDate
}) => {
  // Convert team members to display format with mock stats
  const memberStats: TeamMemberStats[] = teamMembers.map(member => {
    const stats = teamStats.find(s => s.userId === member.id);
    return {
      userId: member.id,
      name: member.name,
      email: member.email,
      totalHours: stats?.totalHours || Math.floor(Math.random() * 40) + 10,
      scheduledHours: stats?.scheduledHours || 40,
      isActive: stats?.isActive || Math.random() > 0.3,
      lastClockIn: stats?.lastClockIn,
      complianceIssues: stats?.complianceIssues || Math.floor(Math.random() * 3),
      overtimeHours: stats?.overtimeHours || Math.floor(Math.random() * 10)
    };
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-6 bg-muted rounded"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (memberStats.length === 0) {
    return (
      <Card className="p-8 text-center">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Team Members Found</h3>
        <p className="text-muted-foreground">
          This team doesn't have any members yet, or they haven't been loaded.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members Overview</h3>
          <p className="text-sm text-muted-foreground">
            Week of {weekDate.toLocaleDateString()} • {memberStats.length} members
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {memberStats.filter(m => m.isActive).length} Active
          </Badge>
          <Badge variant="outline">
            {memberStats.reduce((sum, m) => sum + m.totalHours, 0).toFixed(1)}h Total
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberStats.map((member) => (
          <Card 
            key={member.userId} 
            className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary/40"
            onClick={() => onSelectMember(member.userId)}
          >
            <div className="space-y-3">
              {/* Member Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{member.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  {member.isActive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Currently active" />
                  )}
                  <Badge variant={member.complianceIssues > 0 ? "destructive" : "secondary"} className="text-xs">
                    {member.complianceIssues > 0 ? `${member.complianceIssues} Issues` : 'Compliant'}
                  </Badge>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{member.totalHours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">Tracked</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium">{member.scheduledHours}h</p>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium">{member.overtimeHours}h</p>
                    <p className="text-xs text-muted-foreground">Overtime</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <p className="font-medium">
                      {((member.totalHours / member.scheduledHours) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMember(member.userId);
                }}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
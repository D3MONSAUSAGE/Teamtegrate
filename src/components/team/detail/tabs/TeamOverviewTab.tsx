import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Crown,
  Calendar,
  Activity,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { format } from 'date-fns';
import TeamAnalyticsOverview from '@/components/team/analytics/TeamAnalyticsOverview';
import TeamPerformanceInsights from '@/components/team/analytics/TeamPerformanceInsights';
import { useTeamAnalytics } from '@/hooks/team/useTeamAnalytics';

interface TeamOverviewTabProps {
  team: any;
  teamMembers: any[];
}

const TeamOverviewTab: React.FC<TeamOverviewTabProps> = ({ team, teamMembers }) => {
  const activeMembers = teamMembers.filter(m => m.users).length;
  const managerCount = teamMembers.filter(m => m.role === 'manager').length;
  const memberCount = teamMembers.filter(m => m.role === 'member').length;
  const { analytics } = useTeamAnalytics(team.id);

  return (
    <div className="space-y-6">
      {/* Team Description */}
      {team.description && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Team Description</h4>
          <p className="text-muted-foreground">{team.description}</p>
        </div>
      )}
      
      {/* Basic Team Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Total Members</span>
          </div>
          <p className="text-2xl font-bold text-primary">{team.member_count}</p>
          <p className="text-xs text-muted-foreground">{activeMembers} active</p>
        </div>
        
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Managers</span>
          </div>
          <p className="text-2xl font-bold text-warning">{managerCount}</p>
          <p className="text-xs text-muted-foreground">{memberCount} members</p>
        </div>
        
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Status</span>
          </div>
          <Badge variant={team.is_active ? "default" : "secondary"} className="text-lg px-3 py-1">
            {team.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Created</span>
          </div>
          <p className="text-sm font-semibold">{format(new Date(team.created_at), 'MMM d, yyyy')}</p>
          <p className="text-xs text-muted-foreground">
            {Math.floor((Date.now() - new Date(team.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </p>
        </div>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <TeamAnalyticsOverview teamId={team.id} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {analytics ? (
            <TeamPerformanceInsights analytics={analytics} />
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading Insights</h3>
              <p className="text-muted-foreground">Analyzing team performance data...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Team Details</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Team Name</span>
                  <span className="text-sm">{team.name}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Organization</span>
                  <span className="text-sm text-muted-foreground">
                    {team.organization_id?.substring(0, 8)}...
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Manager</span>
                  <div className="flex items-center gap-1">
                    {team.manager_name ? (
                      <>
                        <Crown className="h-3 w-3 text-warning" />
                        <span className="text-sm">{team.manager_name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">No manager assigned</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm">{format(new Date(team.updated_at), 'MMM d, yyyy HH:mm')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Performance Summary</h4>
              
              <div className="space-y-3">
                {analytics && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-accent" />
                        <span className="text-sm">Completion Rate</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.averageCompletionRate}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-sm">Team Velocity</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.performanceMetrics.teamVelocity} tasks/week</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Tasks</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.totalTasks}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamOverviewTab;
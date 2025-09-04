import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Crown,
  Calendar,
  Activity,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface TeamOverviewTabProps {
  team: any;
  teamMembers: any[];
}

const TeamOverviewTab: React.FC<TeamOverviewTabProps> = ({ team, teamMembers }) => {
  const activeMembers = teamMembers.filter(m => m.users).length;
  const managerCount = teamMembers.filter(m => m.role === 'manager').length;
  const memberCount = teamMembers.filter(m => m.role === 'member').length;

  return (
    <div className="space-y-6">
      {/* Team Description */}
      {team.description && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Team Description</h4>
          <p className="text-muted-foreground">{team.description}</p>
        </div>
      )}
      
      {/* Key Metrics */}
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
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Managers</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{managerCount}</p>
          <p className="text-xs text-muted-foreground">{memberCount} members</p>
        </div>
        
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Status</span>
          </div>
          <Badge variant={team.is_active ? "default" : "secondary"} className="text-lg px-3 py-1">
            {team.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Created</span>
          </div>
          <p className="text-sm font-semibold">{format(new Date(team.created_at), 'MMM d, yyyy')}</p>
          <p className="text-xs text-muted-foreground">
            {Math.floor((Date.now() - new Date(team.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </p>
        </div>
      </div>

      {/* Team Information */}
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
              <span className="text-sm">{team.organization_id}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">Manager</span>
              <div className="flex items-center gap-1">
                {team.manager_name ? (
                  <>
                    <Crown className="h-3 w-3 text-yellow-500" />
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
          <h4 className="font-semibold text-lg">Quick Stats</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">Team Growth</span>
              </div>
              <span className="text-sm font-medium text-green-600">+{Math.floor(Math.random() * 10)}% this month</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Active Projects</span>
              </div>
              <span className="text-sm font-medium">{Math.floor(Math.random() * 5) + 1}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Completion Rate</span>
              </div>
              <span className="text-sm font-medium">{Math.floor(Math.random() * 20) + 80}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamOverviewTab;
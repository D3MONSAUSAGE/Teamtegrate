import React from 'react';
import { Calendar, Users, Clock, TrendingUp, CalendarDays, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { InlineTeamSelector } from '@/components/time-management/InlineTeamSelector';
import { cn } from '@/lib/utils';

interface Tab {
  value: string;
  label: string;
  icon: string;
  ready: boolean;
}

interface ModernTimeTrackingHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  availableTabs: Tab[];
  canManageTeams?: boolean;
  teams?: any[];
  users?: any[];
  selectedTeamId?: string | null;
  selectedUserId?: string | null;
  onTeamChange?: (teamId: string | null) => void;
  onUserChange?: (userId: string | null) => void;
  viewMode?: 'individual' | 'team-totals';
  onViewModeChange?: (mode: 'individual' | 'team-totals') => void;
  isLoading?: boolean;
}

const ModernTimeTrackingHeader: React.FC<ModernTimeTrackingHeaderProps> = ({
  activeTab,
  onTabChange,
  availableTabs,
  canManageTeams,
  teams = [],
  users = [],
  selectedTeamId,
  selectedUserId,
  onTeamChange,
  onUserChange,
  viewMode,
  onViewModeChange,
  isLoading
}) => {
  const currentTime = new Date();
  const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(currentTime, 'h:mm a');

  const selectedTeamName = selectedTeamId ? teams.find(t => t.id === selectedTeamId)?.name : null;

  const getTabIcon = (iconString: string, tabValue: string) => {
    if (tabValue === 'schedule') return <CalendarDays className="h-4 w-4" />;
    if (tabValue === 'time-entries') return <Timer className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-border/50 shadow-lg mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-36 -translate-x-36" />
      
      <div className="relative p-8">
        {/* Top Row - Title and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                My Schedule
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Manage your time and schedule
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">{formattedDate}</div>
              <div className="text-2xl font-semibold text-primary">{formattedTime}</div>
            </div>
          </div>
        </div>

        {/* Middle Row - Team Selector (for managers) */}
        {canManageTeams && (
          <div className="mb-6">
            <InlineTeamSelector
              teams={teams}
              users={users}
              selectedTeamId={selectedTeamId}
              selectedUserId={selectedUserId}
              onTeamChange={onTeamChange}
              onUserChange={onUserChange}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Bottom Row - Tab Navigation and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedTeamName && (
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-medium"
              >
                <Users className="h-4 w-4 mr-2" />
                {selectedTeamName}
              </Badge>
            )}
            
            <Badge 
              variant="outline" 
              className="bg-success/10 text-success border-success/20 px-4 py-2 text-sm font-medium"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Live Updates
            </Badge>
          </div>

          {/* Modern Tab Navigation */}
          <div className="flex items-center gap-2 bg-background/30 backdrop-blur-sm rounded-lg p-1 border border-border/30">
            {availableTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => tab.ready && onTabChange(tab.value)}
                disabled={!tab.ready}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {getTabIcon(tab.icon, tab.value)}
                {tab.label}
                {!tab.ready && <span className="animate-pulse">⌛</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTimeTrackingHeader;
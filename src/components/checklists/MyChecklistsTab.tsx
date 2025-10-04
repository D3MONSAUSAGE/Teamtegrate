import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMyChecklistExecutions, useTeamChecklistExecutionsForDate, useStartChecklistExecution } from '@/hooks/useChecklistExecutions';
import { ChecklistExecutionDialog } from './ChecklistExecutionDialog';
import { CompactDailyStats } from './CompactDailyStats';
import { MobileChecklistCard } from './MobileChecklistCard';
import { ChecklistExecution } from '@/types/checklist';
import { ClipboardList, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { TeamSelect } from '@/components/ui/team-select';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { canStartChecklistExecution } from '@/utils/checklistTimeUtils';
import { useMultipleChecklistTimeWindows } from '@/hooks/useChecklistTimeWindow';

export const MyChecklistsTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecution | null>(null);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  const isAdmin = hasRoleAccess(user?.role, 'admin');
  const { teams, isLoading: teamsLoading } = useTeamAccess();

  // Use different hooks based on role and team selection
  const { data: myExecutions, isLoading: myExecutionsLoading } = useMyChecklistExecutions();
  const { data: teamExecutions, isLoading: teamExecutionsLoading } = useTeamChecklistExecutionsForDate(
    isAdmin && selectedTeamId && selectedTeamId !== 'all' ? selectedTeamId : undefined
  );
  const startExecution = useStartChecklistExecution();

  // Determine which data to show
  const executions = isAdmin && selectedTeamId && selectedTeamId !== 'all' ? teamExecutions : myExecutions;
  const isLoading = isAdmin && selectedTeamId && selectedTeamId !== 'all' ? teamExecutionsLoading : myExecutionsLoading;

  // Get time window statuses for all executions
  const timeWindowStatuses = useMultipleChecklistTimeWindows(executions || []);

  // Sort executions by availability and priority
  const sortedExecutions = executions?.slice().sort((a, b) => {
    const aStatus = timeWindowStatuses[a.id];
    const bStatus = timeWindowStatuses[b.id];
    
    // Available checklists first
    if (aStatus?.isInWindow && !bStatus?.isInWindow) return -1;
    if (!aStatus?.isInWindow && bStatus?.isInWindow) return 1;
    
    // Then by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.checklist?.priority as keyof typeof priorityOrder] || 2;
    const bPriority = priorityOrder[b.checklist?.priority as keyof typeof priorityOrder] || 2;
    
    return aPriority - bPriority;
  });

  const handleStartExecution = async (execution: ChecklistExecution) => {
    const { canStart, reason } = canStartChecklistExecution(execution, true);
    
    if (!canStart && reason) {
      toast({
        title: "Cannot Start Checklist",
        description: reason,
        variant: "destructive",
      });
      return;
    }
    
    // If execution is pending, start it immediately
    if (execution.status === 'pending') {
      try {
        await startExecution.mutateAsync(execution.id);
        toast({
          title: "✓ Checklist Started",
          description: "You can now complete the checklist items.",
        });
        // Open dialog with the started execution
        setSelectedExecution({ ...execution, status: 'in_progress' as const, started_at: new Date().toISOString() });
        setExecutionDialogOpen(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to start checklist. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // For non-pending executions, just open the dialog
      setSelectedExecution(execution);
      setExecutionDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* Top Row: Team Selector (if admin) + Daily Stats */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          {/* Team Selector for Admins */}
          {isAdmin && (
            <Card className="flex-1">
              <CardContent className="p-3 md:p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Select Team</span>
                  </div>
                  <TeamSelect
                    teams={teams}
                    isLoading={teamsLoading}
                    selectedTeam={selectedTeamId}
                    onTeamChange={(teamId) => setSelectedTeamId(teamId === 'all' ? '' : teamId || '')}
                    optional
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Daily Stats */}
          <CompactDailyStats />
        </div>
        
        {/* Today's Checklists Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold">
              {isAdmin && selectedTeamId && selectedTeamId !== 'all' ? 'Team Checklists' : 'Today\'s Checklists'}
            </h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {sortedExecutions?.length || 0} tasks for {format(new Date(), "MMM d, yyyy")}
          </div>
        </div>

        {/* Mobile-First Checklists Grid */}
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedExecutions?.map((execution) => {
            const timeStatus = timeWindowStatuses[execution.id];
            const { canStart, reason } = canStartChecklistExecution(execution, true);
            
            return (
              <MobileChecklistCard
                key={execution.id}
                execution={execution}
                timeStatus={timeStatus}
                canStart={canStart}
                reason={reason}
                onStart={() => handleStartExecution(execution)}
                isAdmin={isAdmin && selectedTeamId && selectedTeamId !== 'all'}
              />
            );
          })}
        </div>

        {sortedExecutions?.length === 0 && (
          <Card className="text-center py-8 md:py-12">
            <CardContent className="p-6">
              <ClipboardList className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">
                {isAdmin && !selectedTeamId 
                  ? 'Select a team to view checklists' 
                  : isAdmin && selectedTeamId && selectedTeamId !== 'all'
                    ? 'No checklists for this team today'
                    : 'No checklists for today'
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {isAdmin && !selectedTeamId 
                  ? 'Choose a team from the dropdown above to see their scheduled checklists.'
                  : isAdmin && selectedTeamId && selectedTeamId !== 'all'
                    ? 'This team doesn\'t have any checklists scheduled for today.'
                    : 'You don\'t have any checklists scheduled for today. Check back later or ask your manager about available checklists.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Execution Dialog */}
      <ChecklistExecutionDialog
        execution={selectedExecution}
        open={executionDialogOpen}
        onOpenChange={setExecutionDialogOpen}
      />
    </>
  );
};
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMyChecklistExecutions, useTeamChecklistExecutionsForDate, useStartChecklistExecution } from '@/hooks/useChecklistExecutions';
import { ChecklistExecutionDialog } from './ChecklistExecutionDialog';
import { CompactDailyStats } from './CompactDailyStats';
import ChecklistTimeStatusBadge from './ChecklistTimeStatusBadge';
import ChecklistCountdownTimer from './ChecklistCountdownTimer';
import { ChecklistExecution } from '@/types/checklist';
import { CalendarIcon, Clock, CheckCircle, AlertCircle, Play, ClipboardList, Users, Timer, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { TeamSelect } from '@/components/ui/team-select';
import { useTeams } from '@/hooks/useTeams';
import { canStartChecklistExecution, formatTimeWindow, getTimeStatusStyling } from '@/utils/checklistTimeUtils';
import { useMultipleChecklistTimeWindows } from '@/hooks/useChecklistTimeWindow';

export const MyChecklistsTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecution | null>(null);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  const isAdmin = hasRoleAccess(user?.role, 'admin');
  const { teams, isLoading: teamsLoading } = useTeams();

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
          title: "Checklist Started",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-orange-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'verified':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-orange-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="space-y-6">
        {/* Top Row: Team Selector (if admin) + Daily Stats */}
        <div className="flex gap-4">
          {/* Team Selector for Admins */}
          {isAdmin && (
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="space-y-3">
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
        
        {/* Today's Checklists Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              {isAdmin && selectedTeamId && selectedTeamId !== 'all' ? 'Team Checklists' : 'Today\'s Checklists'}
            </h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {sortedExecutions?.length || 0} tasks for {format(new Date(), "MMM d, yyyy")}
          </div>
        </div>

        {/* Checklists Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedExecutions?.map((execution) => {
            const timeStatus = timeWindowStatuses[execution.id];
            const { canStart, reason } = canStartChecklistExecution(execution, true);
            const styling = timeStatus ? getTimeStatusStyling(timeStatus.status) : null;
            
            return (
              <Card 
                key={execution.id} 
                className={cn(
                  "group hover:shadow-xl transition-all duration-300 relative overflow-hidden border-border/50",
                  "hover:border-primary/20 hover:-translate-y-1",
                  timeStatus?.isInWindow && "ring-2 ring-success/30 shadow-lg bg-gradient-to-br from-success/5 to-transparent",
                  !canStart && execution.status === 'pending' && "opacity-75"
                )}
              >
                {/* Time status indicator bar */}
                {timeStatus && timeStatus.status !== 'no-window' && (
                  <div 
                    className={cn(
                      "absolute top-0 left-0 right-0 h-1.5 transition-all duration-300",
                      timeStatus.status === 'available' && "bg-gradient-to-r from-success to-success/70",
                      timeStatus.status === 'upcoming' && "bg-gradient-to-r from-primary to-primary/70", 
                      timeStatus.status === 'expired' && "bg-gradient-to-r from-destructive to-destructive/70"
                    )}
                  />
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                      {execution.checklist?.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "transition-all duration-200 shadow-sm",
                          getPriorityColor(execution.checklist?.priority || 'medium')
                        )}
                      >
                        {execution.checklist?.priority}
                      </Badge>
                      {!canStart && execution.status === 'pending' && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getStatusIcon(execution.status)}
                    <span className="capitalize font-medium">{execution.status.replace('_', ' ')}</span>
                  </div>
                </CardHeader>
              
                <CardContent className="space-y-4">
                  {execution.checklist?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {execution.checklist.description}
                    </p>
                  )}

                  {/* Time Window Status */}
                  {timeStatus && timeStatus.status !== 'no-window' && (
                    <ChecklistTimeStatusBadge
                      checklist={execution.checklist}
                      executionDate={execution.execution_date}
                      showCountdown={true}
                      className="self-start"
                    />
                  )}

                  {/* Show assigned user when admin is viewing team checklists */}
                  {isAdmin && selectedTeamId && selectedTeamId !== 'all' && execution.assigned_user && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                      <Users className="h-4 w-4" />
                      <span>Assigned to: {execution.assigned_user.name || execution.assigned_user.email}</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary">{execution.execution_score}%</span>
                    </div>
                    <Progress value={execution.execution_score} className="h-2.5 bg-muted" />
                  </div>

                  {/* Enhanced Timing Info */}
                  {execution.checklist?.execution_window_start && execution.checklist?.execution_window_end ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeWindow(execution.checklist.execution_window_start, execution.checklist.execution_window_end)}</span>
                      </div>
                      {timeStatus && timeStatus.status !== 'no-window' && (
                        <ChecklistCountdownTimer
                          checklist={execution.checklist}
                          executionDate={execution.execution_date}
                          variant="minimal"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Available anytime</span>
                    </div>
                  )}

                  {/* Cutoff Time Warning */}
                  {execution.checklist?.cutoff_time && timeStatus?.isInWindow && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-md p-2">
                      <Timer className="h-3 w-3" />
                      <span>Cutoff: {execution.checklist.cutoff_time}</span>
                    </div>
                  )}

                  {/* Score Display */}
                  {execution.status === 'verified' && (
                    <div className="flex justify-between text-sm">
                      <span>Total Score:</span>
                      <span className="font-semibold text-blue-600">
                        {execution.total_score}/100
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleStartExecution(execution)}
                    className={cn(
                      "w-full transition-all duration-300 font-medium",
                      timeStatus?.isInWindow && execution.status === 'pending' && "shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary/90",
                      execution.status === 'in_progress' && "bg-gradient-to-r from-accent to-accent/90"
                    )}
                    variant={execution.status === 'pending' && canStart ? 'default' : 'outline'}
                    disabled={execution.status === 'verified' || (execution.status === 'pending' && !canStart)}
                    title={!canStart ? reason : undefined}
                  >
                    {execution.status === 'pending' && canStart && (
                      <span className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Start Checklist
                      </span>
                    )}
                    {execution.status === 'pending' && !canStart && (
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {timeStatus?.status === 'upcoming' ? 'Not Available Yet' : 'Time Expired'}
                      </span>
                    )}
                    {execution.status === 'in_progress' && (
                      <span className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Continue
                      </span>
                    )}
                    {execution.status === 'completed' && 'Review'}
                    {execution.status === 'verified' && (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </span>
                    )}
                  </Button>

                  {/* Time restriction message */}
                  {!canStart && reason && execution.status === 'pending' && (
                    <p className="text-xs text-muted-foreground text-center italic">
                      {reason}
                    </p>
                  )}
                 </CardContent>
               </Card>
             );
           })}
         </div>

        {sortedExecutions?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isAdmin && !selectedTeamId 
                  ? 'Select a team to view checklists' 
                  : isAdmin && selectedTeamId && selectedTeamId !== 'all'
                    ? 'No checklists for this team today'
                    : 'No checklists for today'
                }
              </h3>
              <p className="text-muted-foreground">
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
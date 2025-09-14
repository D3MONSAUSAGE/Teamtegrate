import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdvancedChecklistHistory } from '@/hooks/useAdvancedChecklistHistory';
import { ChecklistHistoryFilters } from './ChecklistHistoryFilters';
import { ChecklistExecutionDetailDialog } from './ChecklistExecutionDetailDialog';
import { Calendar, Clock, CheckCircle, AlertCircle, Eye, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export const ChecklistHistoryTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [limit, setLimit] = useState(50);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: executions, isLoading } = useAdvancedChecklistHistory({
    dateRange,
    teamId: selectedTeam === 'all' ? undefined : selectedTeam,
    searchTerm,
    status: statusFilter,
  }, limit);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'verified':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserTeams = (user: any) => {
    if (!user?.team_memberships) return [];
    return user.team_memberships.map((tm: any) => tm.teams).filter(Boolean);
  };

  const handleViewDetails = (execution: any) => {
    setSelectedExecution(execution);
    setDetailDialogOpen(true);
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
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <ChecklistHistoryFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedTeam={selectedTeam}
        onTeamChange={setSelectedTeam}
        limit={limit}
        onLimitChange={setLimit}
      />

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {executions?.length || 0} executions
        {dateRange?.from && (
          <span className="ml-2">
            from {format(dateRange.from, 'MMM d, yyyy')}
            {dateRange.to && ` to ${format(dateRange.to, 'MMM d, yyyy')}`}
          </span>
        )}
        {selectedTeam !== 'all' && (
          <span className="ml-2">• Team filtered</span>
        )}
      </div>

      {/* History List */}
      <div className="space-y-4">
        {executions?.map((execution) => {
          const executorTeams = getUserTeams(execution.assigned_user);
          
          return (
            <Card key={execution.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-lg">{execution.checklist?.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(execution.execution_date), 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <span>by {execution.assigned_user?.name}</span>
                      </div>
                      {executorTeams.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {executorTeams.map((team: any) => (
                            <Badge key={team.id} variant="secondary" className="text-xs">
                              {team.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(execution)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Badge className={getPriorityColor(execution.checklist?.priority || 'medium')}>
                      {execution.checklist?.priority}
                    </Badge>
                    <Badge className={getStatusColor(execution.status)}>
                      {getStatusIcon(execution.status)}
                      <span className="ml-1 capitalize">{execution.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Execution Score:</span>
                  <div className="font-semibold">{execution.execution_score}%</div>
                </div>

                {execution.status === 'verified' && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Verification Score:</span>
                      <div className="font-semibold text-blue-600">{execution.verification_score}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Score:</span>
                      <div className="font-semibold text-green-600">{execution.total_score}%</div>
                    </div>
                  </>
                )}

                {execution.status !== 'verified' && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <div>
                        {execution.started_at 
                          ? format(new Date(execution.started_at), 'h:mm a')
                          : 'Not started'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <div>
                        {execution.completed_at 
                          ? format(new Date(execution.completed_at), 'h:mm a')
                          : 'Not completed'
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>

              {execution.notes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Notes:</span>
                  <p className="text-sm mt-1">{execution.notes}</p>
                </div>
              )}

                {execution.status === 'verified' && execution.verifier && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>
                      Verified by {execution.verifier.name} on{' '}
                      {format(new Date(execution.verified_at!), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {executions?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No execution history found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateRange?.from || selectedTeam !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start completing checklists to see your execution history here.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <ChecklistExecutionDetailDialog
        execution={selectedExecution}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
};
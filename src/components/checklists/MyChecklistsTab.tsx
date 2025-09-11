import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMyChecklistExecutions } from '@/hooks/useChecklistExecutions';
import { ChecklistExecutionDialog } from './ChecklistExecutionDialog';
import { ChecklistExecution } from '@/types/checklist';
import { CalendarIcon, Clock, CheckCircle, AlertCircle, Play, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const MyChecklistsTab: React.FC = () => {
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecution | null>(null);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);

  // Always show today's checklists
  const { data: executions, isLoading } = useMyChecklistExecutions();

  const handleStartExecution = (execution: ChecklistExecution) => {
    setSelectedExecution(execution);
    setExecutionDialogOpen(true);
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
        {/* Today's Checklists Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Today's Checklists</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {executions?.length || 0} tasks for {format(new Date(), "MMM d, yyyy")}
          </div>
        </div>

        {/* Checklists Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {executions?.map((execution) => (
            <Card key={execution.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold truncate">
                    {execution.checklist?.name}
                  </CardTitle>
                  <Badge className={getPriorityColor(execution.checklist?.priority || 'medium')}>
                    {execution.checklist?.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getStatusIcon(execution.status)}
                  <span className="capitalize">{execution.status.replace('_', ' ')}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {execution.checklist?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {execution.checklist.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{execution.execution_score}%</span>
                  </div>
                  <Progress value={execution.execution_score} className="h-2" />
                </div>

                {/* Timing Info */}
                {execution.checklist?.execution_window_start && execution.checklist?.execution_window_end && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {execution.checklist.execution_window_start} - {execution.checklist.execution_window_end}
                    </span>
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
                  className="w-full"
                  variant={execution.status === 'pending' ? 'default' : 'outline'}
                  disabled={execution.status === 'verified'}
                >
                  {execution.status === 'pending' && 'Start Checklist'}
                  {execution.status === 'in_progress' && 'Continue'}
                  {execution.status === 'completed' && 'Review'}
                  {execution.status === 'verified' && 'Verified ✓'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {executions?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No checklists for today</h3>
              <p className="text-muted-foreground">
                You don't have any checklists scheduled for today. Check back later or ask your manager about available checklists.
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
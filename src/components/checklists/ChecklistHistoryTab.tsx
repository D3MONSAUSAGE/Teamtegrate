import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChecklistExecutionHistory } from '@/hooks/useChecklistExecutions';
import { ChecklistExecution } from '@/types/checklist';
import { Calendar, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export const ChecklistHistoryTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [limit, setLimit] = useState(50);

  const { data: executions, isLoading } = useChecklistExecutionHistory(undefined, limit);

  const filteredExecutions = executions?.filter(execution => {
    const matchesSearch = execution.checklist?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         execution.assigned_user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search checklists or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 items</SelectItem>
            <SelectItem value="50">50 items</SelectItem>
            <SelectItem value="100">100 items</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredExecutions?.length || 0} of {executions?.length || 0} executions
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredExecutions?.map((execution) => (
          <Card key={execution.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-lg">{execution.checklist?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(execution.execution_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
        ))}
      </div>

      {filteredExecutions?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No execution history found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start completing checklists to see your execution history here.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
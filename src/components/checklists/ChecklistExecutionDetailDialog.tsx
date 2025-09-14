import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, Eye, AlertTriangle, User, Calendar, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ChecklistExecutionDetailDialogProps {
  execution: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChecklistExecutionDetailDialog: React.FC<ChecklistExecutionDetailDialogProps> = ({
  execution,
  open,
  onOpenChange,
}) => {
  if (!execution) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getItemStatusIcon = (item: any) => {
    if (item.is_verified) {
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    } else if (item.is_completed) {
      return <CheckSquare className="h-4 w-4 text-green-600" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getUserTeams = (user: any) => {
    if (!user?.team_memberships) return [];
    return user.team_memberships.map((tm: any) => tm.teams).filter(Boolean);
  };

  const executorTeams = getUserTeams(execution.assigned_user);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Checklist Execution Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{execution.checklist?.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(execution.execution_date), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {execution.assigned_user?.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {execution.checklist?.priority || 'medium'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getStatusIcon(execution.status)}
                    {execution.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Team Info */}
              {executorTeams.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground mr-2">Teams:</span>
                  <div className="flex gap-1 flex-wrap">
                    {executorTeams.map((team: any) => (
                      <Badge key={team.id} variant="secondary" className="text-xs">
                        {team.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Execution Score:</span>
                  <div className="font-semibold text-lg">{execution.execution_score || 0}%</div>
                </div>
                {execution.verification_score && (
                  <div>
                    <span className="text-muted-foreground">Verification Score:</span>
                    <div className="font-semibold text-lg text-blue-600">
                      {execution.verification_score}%
                    </div>
                  </div>
                )}
                {execution.total_score && (
                  <div>
                    <span className="text-muted-foreground">Total Score:</span>
                    <div className="font-semibold text-lg text-green-600">
                      {execution.total_score}%
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Execution Timeline</h4>
              <div className="space-y-3">
                {execution.started_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">Started:</span>
                    <span>{format(new Date(execution.started_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {execution.completed_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{format(new Date(execution.completed_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {execution.verified_at && execution.verifier && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-muted-foreground">Verified by:</span>
                    <span className="font-medium">{execution.verifier.name}</span>
                    <span className="text-muted-foreground">
                      on {format(new Date(execution.verified_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Execution Items */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Checklist Items</h4>
              <div className="space-y-3">
                {execution.checklist_execution_items?.map((item: any, index: number) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-sm text-muted-foreground mt-1">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <h5 className="font-medium">{item.checklist_item?.title}</h5>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {item.completed_at && (
                              <span>
                                Completed: {format(new Date(item.completed_at), 'h:mm a')}
                              </span>
                            )}
                            {item.verified_at && item.verifier && (
                              <span>
                                Verified by {item.verifier.name} at{' '}
                                {format(new Date(item.verified_at), 'h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getItemStatusIcon(item)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(!execution.checklist_execution_items || execution.checklist_execution_items.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>No execution items found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {execution.notes && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{execution.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
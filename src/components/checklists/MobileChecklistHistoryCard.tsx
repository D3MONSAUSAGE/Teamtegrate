import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertCircle, User, Eye, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import EnhancedButton from '@/components/mobile/EnhancedButton';

interface MobileChecklistHistoryCardProps {
  execution: any;
  onViewDetails: (execution: any) => void;
}

export const MobileChecklistHistoryCard: React.FC<MobileChecklistHistoryCardProps> = ({
  execution,
  onViewDetails
}) => {
  const getPriorityGradient = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 'low':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

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
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'verified':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'in_progress':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      case 'overdue':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted/50 text-muted-foreground border-muted';
    }
  };

  const getUserTeams = (user: any) => {
    if (!user?.team_memberships) return [];
    return user.team_memberships.map((tm: any) => tm.teams).filter(Boolean);
  };

  const executorTeams = getUserTeams(execution.assigned_user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
        {/* Priority Gradient Bar */}
        <div className={cn("h-1", getPriorityGradient(execution.checklist?.priority || 'medium'))} />

        <div className="p-4 space-y-3">
          {/* Header: Name and Status */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight flex-1 line-clamp-2">
                {execution.checklist?.name}
              </h3>
              <Badge 
                variant="outline" 
                className={cn("shrink-0 text-xs", getStatusColor(execution.status))}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(execution.status)}
                  <span className="capitalize">{execution.status.replace('_', ' ')}</span>
                </span>
              </Badge>
            </div>

            {/* Date and User Info */}
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(execution.execution_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>{execution.assigned_user?.name}</span>
              </div>
            </div>

            {/* Team Badges */}
            {executorTeams.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {executorTeams.map((team: any) => (
                  <Badge key={team.id} variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {team.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Scores Section */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Execution</div>
              <div className="text-lg font-bold text-primary">{execution.execution_score}%</div>
            </div>
            
            {execution.status === 'verified' && (
              <>
                <div className="text-center border-l border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Verification</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {execution.verification_score}%
                  </div>
                </div>
                <div className="text-center border-l border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Total</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {execution.total_score}%
                  </div>
                </div>
              </>
            )}

            {execution.status !== 'verified' && (
              <>
                <div className="text-center border-l border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Started</div>
                  <div className="text-sm font-medium">
                    {execution.started_at 
                      ? format(new Date(execution.started_at), 'h:mm a')
                      : '-'
                    }
                  </div>
                </div>
                <div className="text-center border-l border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Completed</div>
                  <div className="text-sm font-medium">
                    {execution.completed_at 
                      ? format(new Date(execution.completed_at), 'h:mm a')
                      : '-'
                    }
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          {execution.notes && (
            <div className="p-2 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground line-clamp-2">{execution.notes}</p>
            </div>
          )}

          {/* Verification Info */}
          {execution.status === 'verified' && execution.verifier && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-500/5 p-2 rounded-md">
              <CheckCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="line-clamp-1">
                Verified by {execution.verifier.name}
              </span>
            </div>
          )}

          {/* Action Button */}
          <EnhancedButton
            onClick={() => onViewDetails(execution)}
            className="w-full"
            size="sm"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </EnhancedButton>
        </div>
      </Card>
    </motion.div>
  );
};

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useTeamChecklistExecutions } from '@/hooks/useChecklistExecutions';
import { format } from 'date-fns';

export const ManagerDailyStats: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data: executions, isLoading } = useTeamChecklistExecutions(today);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalExecutions = executions?.length || 0;
  const completedExecutions = executions?.filter(e => e.status === 'completed' || e.status === 'verified').length || 0;
  const verifiedExecutions = executions?.filter(e => e.status === 'verified').length || 0;
  const pendingVerifications = executions?.filter(e => e.status === 'completed').length || 0;

  const executionPercentage = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0;
  const verificationPercentage = completedExecutions > 0 ? Math.round((verifiedExecutions / completedExecutions) * 100) : 0;

  // Get unique team members
  const uniqueUsers = new Set(executions?.map(e => e.assigned_to_user_id)).size;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Team Progress Today
          <Badge variant="outline" className="ml-auto">
            {format(new Date(), 'MMM d, yyyy')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Execution Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Team Execution Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {completedExecutions}/{totalExecutions} completed
              </span>
              <Badge variant={executionPercentage >= 80 ? "default" : "outline"} className="text-xs">
                {executionPercentage}%
              </Badge>
            </div>
          </div>
          <Progress 
            value={executionPercentage} 
            className="h-2"
          />
        </div>

        {/* Team Verification Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Team Verification Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {verifiedExecutions}/{completedExecutions} verified
              </span>
              <Badge variant={verificationPercentage >= 80 ? "default" : "outline"} className="text-xs">
                {verificationPercentage}%
              </Badge>
            </div>
          </div>
          <Progress 
            value={verificationPercentage} 
            className="h-2"
          />
        </div>

        {/* Pending Verifications Alert */}
        {pendingVerifications > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {pendingVerifications} checklist{pendingVerifications > 1 ? 's' : ''} awaiting verification
              </span>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 pt-2 border-t border-border/50">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{totalExecutions}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{completedExecutions}</div>
            <div className="text-xs text-muted-foreground">Executed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{verifiedExecutions}</div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{uniqueUsers}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
        </div>

        {/* Quick Status */}
        {totalExecutions === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No checklists scheduled for today</p>
          </div>
        ) : executionPercentage === 100 && verificationPercentage === 100 ? (
          <div className="text-center py-2">
            <Badge variant="default" className="bg-green-600">
              🎉 All team checklists completed and verified!
            </Badge>
          </div>
        ) : executionPercentage === 100 ? (
          <div className="text-center py-2">
            <Badge variant="outline" className="border-green-600 text-green-600">
              ✅ All checklists executed - {pendingVerifications} awaiting verification
            </Badge>
          </div>
        ) : (
          <div className="text-center py-2">
            <Badge variant="outline">
              📋 {totalExecutions - completedExecutions} checklists remaining
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
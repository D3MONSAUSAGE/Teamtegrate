import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye, Calendar } from 'lucide-react';
import { useMyChecklistExecutions } from '@/hooks/useChecklistExecutions';
import { format } from 'date-fns';

export const CompactDailyStats: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data: executions, isLoading } = useMyChecklistExecutions(today);

  if (isLoading) {
    return (
      <Card className="flex-1">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-6 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalExecutions = executions?.length || 0;
  const completedExecutions = executions?.filter(e => e.status === 'completed' || e.status === 'verified').length || 0;
  const verifiedExecutions = executions?.filter(e => e.status === 'verified').length || 0;

  const executionPercentage = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0;
  const verificationPercentage = completedExecutions > 0 ? Math.round((verifiedExecutions / completedExecutions) * 100) : 0;

  return (
    <Card className="flex-1 border-primary/20">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Today's Progress</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {format(new Date(), 'MMM d')}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-base font-semibold text-primary">{totalExecutions}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-base font-semibold text-green-600">{completedExecutions}</div>
            <div className="text-xs text-muted-foreground">Done</div>
          </div>
          <div>
            <div className="text-base font-semibold text-blue-600">{verifiedExecutions}</div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <div className="flex-1">
              <Progress value={executionPercentage} className="h-1.5" />
            </div>
            <span className="text-xs font-medium">{executionPercentage}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-blue-600" />
            <div className="flex-1">
              <Progress value={verificationPercentage} className="h-1.5" />
            </div>
            <span className="text-xs font-medium">{verificationPercentage}%</span>
          </div>
        </div>

        {/* Status Badge */}
        {totalExecutions === 0 ? (
          <Badge variant="outline" className="w-full justify-center text-xs">
            No checklists today
          </Badge>
        ) : executionPercentage === 100 && verificationPercentage === 100 ? (
          <Badge variant="default" className="w-full justify-center text-xs bg-green-600">
            🎉 All complete!
          </Badge>
        ) : (
          <Badge variant="outline" className="w-full justify-center text-xs">
            {totalExecutions - completedExecutions} remaining
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
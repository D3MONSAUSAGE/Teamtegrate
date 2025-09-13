import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck, Calendar } from "lucide-react";
import { format } from 'date-fns';

interface DailyScoreData {
  date: string;
  totalChecklists: number;
  completedChecklists: number;
  verifiedChecklists: number;
  executionPercentage: number;
  verificationPercentage: number;
}

interface DailyScoreCardProps {
  day: string;
  data?: DailyScoreData;
}

const getPerformanceColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600 bg-green-50';
  if (percentage >= 75) return 'text-blue-600 bg-blue-50';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const getPerformanceBadge = (percentage: number) => {
  if (percentage >= 90) return { variant: 'default' as const, color: 'bg-green-100 text-green-800' };
  if (percentage >= 75) return { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' };
  if (percentage >= 50) return { variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' };
  return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
};

export const DailyScoreCard: React.FC<DailyScoreCardProps> = ({ day, data }) => {
  const hasData = data && data.totalChecklists > 0;
  const executionBadge = getPerformanceBadge(data?.executionPercentage || 0);
  const verificationBadge = getPerformanceBadge(data?.verificationPercentage || 0);

  return (
    <Card className={`h-full transition-all duration-200 ${hasData ? 'hover:shadow-md' : 'opacity-60'}`}>
      <CardContent className="p-4 space-y-3">
        {/* Day Header */}
        <div className="text-center">
          <div className="font-semibold text-sm text-foreground">{day.slice(0, 3)}</div>
          {data && (
            <div className="text-xs text-muted-foreground">
              {format(new Date(data.date), 'MMM dd')}
            </div>
          )}
        </div>

        {hasData ? (
          <>
            {/* Checklist Count */}
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{data.totalChecklists}</div>
              <div className="text-xs text-muted-foreground">Checklists</div>
            </div>

            {/* Execution Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Execute</span>
                </div>
                <Badge 
                  variant={executionBadge.variant}
                  className={`text-xs px-1.5 py-0.5 ${executionBadge.color}`}
                >
                  {data.executionPercentage}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Verify</span>
                </div>
                <Badge 
                  variant={verificationBadge.variant}
                  className={`text-xs px-1.5 py-0.5 ${verificationBadge.color}`}
                >
                  {data.verificationPercentage}%
                </Badge>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    data.executionPercentage >= 90 ? 'bg-green-500' :
                    data.executionPercentage >= 75 ? 'bg-blue-500' :
                    data.executionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.executionPercentage}%` }}
                />
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    data.verificationPercentage >= 90 ? 'bg-green-500' :
                    data.verificationPercentage >= 75 ? 'bg-blue-500' :
                    data.verificationPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.verificationPercentage}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">No Data</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
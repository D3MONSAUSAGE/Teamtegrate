
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DailyScore } from '@/types';

interface DailyScoreCardProps {
  score: DailyScore;
}

const DailyScoreCard: React.FC<DailyScoreCardProps> = ({ score }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Daily Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {score.totalTasks > 0 
              ? `${score.completedTasks} of ${score.totalTasks} tasks completed`
              : `${score.completedTasks} tasks completed today`
            }
          </span>
          <span className="font-bold text-xl">{score.percentage}%</span>
        </div>
        <Progress value={score.percentage} className="h-2" />
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {score.totalTasks === 0 && score.completedTasks === 0 ? (
            <span>No tasks scheduled or completed today</span>
          ) : score.totalTasks === 0 ? (
            <span>Great job! You completed {score.completedTasks} tasks today</span>
          ) : score.percentage < 100 ? (
            <span>{score.totalTasks - score.completedTasks} tasks remaining</span>
          ) : (
            <span>All tasks completed!</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyScoreCard;

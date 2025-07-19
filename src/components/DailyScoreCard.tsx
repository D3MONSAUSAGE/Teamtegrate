
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DailyScore } from '@/types';
import { Target } from 'lucide-react';

interface DailyScoreCardProps {
  score: DailyScore;
}

const DailyScoreCard: React.FC<DailyScoreCardProps> = ({ score }) => {
  return (
    <div className="group border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20">
          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="font-semibold text-card-foreground">Daily Score</h3>
      </div>
      
      <div className="space-y-2">
        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
          {score.percentage}%
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="text-muted-foreground">
            {score.completedTasks} of {score.totalTasks} completed
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <Progress value={score.percentage} className="h-2" />
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        {score.totalTasks === 0 ? (
          <span>No tasks scheduled for today</span>
        ) : (
          <span>
            {score.percentage < 100 
              ? `${score.totalTasks - score.completedTasks} tasks remaining` 
              : 'All tasks completed!'}
          </span>
        )}
      </div>
    </div>
  );
};

export default DailyScoreCard;

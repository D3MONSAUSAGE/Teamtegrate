
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyScore } from '@/types';
import { Trophy, Target, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedDailyScoreCardProps {
  score: DailyScore;
}

const EnhancedDailyScoreCard: React.FC<EnhancedDailyScoreCardProps> = ({ score }) => {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'from-emerald-500 to-green-400';
    if (percentage >= 70) return 'from-blue-500 to-cyan-400';
    if (percentage >= 50) return 'from-orange-500 to-yellow-400';
    return 'from-red-500 to-pink-400';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return { icon: Trophy, label: 'Excellent', color: 'text-emerald-500' };
    if (percentage >= 70) return { icon: Star, label: 'Great', color: 'text-blue-500' };
    if (percentage >= 50) return { icon: Target, label: 'Good', color: 'text-orange-500' };
    return { icon: Zap, label: 'Getting Started', color: 'text-red-500' };
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score.percentage / 100) * circumference;
  
  const badge = getScoreBadge(score.percentage);
  const BadgeIcon = badge.icon;

  return (
    <Card className="modern-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          Daily Score
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Circular Progress */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="stop-primary" />
                  <stop offset="100%" className="stop-accent" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500",
                `bg-gradient-to-r ${getScoreColor(score.percentage)}`
              )}>
                {score.percentage}%
              </span>
              <div className="flex items-center gap-1 mt-1">
                <BadgeIcon className={cn("h-4 w-4", badge.color)} />
                <span className={cn("text-xs font-medium", badge.color)}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {score.completedTasks} of {score.totalTasks} tasks completed
            </span>
            <span className="font-medium">
              {score.totalTasks > 0 ? Math.round((score.completedTasks / score.totalTasks) * 100) : 0}%
            </span>
          </div>
          
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r",
                getScoreColor(score.percentage)
              )}
              style={{ width: `${score.percentage}%` }}
            />
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            {score.totalTasks === 0 ? (
              <span>No tasks scheduled for today</span>
            ) : (
              <span>
                {score.percentage < 100 
                  ? `${score.totalTasks - score.completedTasks} tasks remaining` 
                  : '🎉 All tasks completed!'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedDailyScoreCard;

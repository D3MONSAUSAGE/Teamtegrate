import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Zap, Target, TrendingUp } from 'lucide-react';
import type { LeaderboardEntry } from '@/hooks/useOrgLeaderboard';
import { EmptyStateCard } from './EmptyStateCard';

interface PerformanceLeaderboardProps {
  leaderboard: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}

export const PerformanceLeaderboard: React.FC<PerformanceLeaderboardProps> = ({
  leaderboard,
  isLoading
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
            {rank}
          </div>
        );
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Top Performer': return <Trophy className="h-3 w-3" />;
      case 'Quality Master': return <Award className="h-3 w-3" />;
      case 'High Volume': return <Zap className="h-3 w-3" />;
      case 'Consistent': return <Target className="h-3 w-3" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-warning';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <EmptyStateCard
        title="No Performance Data"
        description="Complete tasks to start building your performance history and see leaderboard rankings."
        icon="chart"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              {/* Rank Badge */}
              <div className="flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{entry.user_name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {entry.team_name || 'No Team'}
                </div>
                {entry.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {entry.badges.map((badge) => (
                      <Badge
                        key={badge}
                        variant="secondary"
                        className="text-xs gap-1 py-0 h-5"
                      >
                        {getBadgeIcon(badge)}
                        <span>{badge}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Score & Stats */}
              <div className="text-right flex-shrink-0">
                <div className={`text-2xl font-bold ${getScoreColor(entry.total_score)}`}>
                  {entry.total_score.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                  <Target className="h-3 w-3" />
                  {entry.completed_tasks} tasks • {entry.completion_rate.toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TeamComparison } from "@/services/checklistReportsService";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";

interface TeamComparisonReportProps {
  data: TeamComparison[];
  isLoading?: boolean;
  weekStart: string;
}

export function TeamComparisonReport({ data, isLoading, weekStart }: TeamComparisonReportProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Rankings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Rankings</CardTitle>
          <CardDescription>Week of {format(parseISO(weekStart), 'MMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No team comparison data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400/20 to-yellow-500/20 border-yellow-500/50";
    if (rank === 2) return "from-gray-300/20 to-gray-400/20 border-gray-400/50";
    if (rank === 3) return "from-orange-400/20 to-orange-500/20 border-orange-500/50";
    return "from-background to-background border-border";
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Team Rankings</CardTitle>
            <CardDescription className="text-xs">
              Week of {format(parseISO(weekStart), 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
        </Card>

        {data.map((team) => (
          <Card
            key={team.team_id}
            className={`overflow-hidden bg-gradient-to-br ${getRankColor(team.team_rank)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {team.team_rank <= 3 && (
                    <Trophy
                      className={`h-6 w-6 ${
                        team.team_rank === 1
                          ? "text-yellow-500"
                          : team.team_rank === 2
                          ? "text-gray-400"
                          : "text-orange-500"
                      }`}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{team.team_name}</h3>
                    <p className="text-xs text-muted-foreground">Rank #{team.team_rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{Number(team.total_score).toFixed(1)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(Number(team.week_over_week_change))}
                    <span className={Number(team.week_over_week_change) > 0 ? "text-green-600" : "text-red-600"}>
                      {Math.abs(Number(team.week_over_week_change)).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-background/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Execution</p>
                  <p className="text-sm font-semibold">{Number(team.execution_score).toFixed(1)}%</p>
                </div>
                <div className="bg-background/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Verification</p>
                  <p className="text-sm font-semibold">{Number(team.verification_score).toFixed(1)}%</p>
                </div>
                <div className="bg-background/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Complete</p>
                  <p className="text-sm font-semibold">{Number(team.completion_rate).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Rankings</CardTitle>
        <CardDescription>Week of {format(parseISO(weekStart), 'MMM d, yyyy')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((team) => (
            <Card
              key={team.team_id}
              className={`overflow-hidden bg-gradient-to-r ${getRankColor(team.team_rank)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {team.team_rank <= 3 ? (
                        <Trophy
                          className={`h-8 w-8 ${
                            team.team_rank === 1
                              ? "text-yellow-500"
                              : team.team_rank === 2
                              ? "text-gray-400"
                              : "text-orange-500"
                          }`}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-semibold">{team.team_rank}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{team.team_name}</h3>
                      <p className="text-sm text-muted-foreground">Overall Score: {Number(team.total_score).toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Execution</p>
                      <p className="text-lg font-semibold">{Number(team.execution_score).toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Verification</p>
                      <p className="text-lg font-semibold">{Number(team.verification_score).toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Completion</p>
                      <p className="text-lg font-semibold">{Number(team.completion_rate).toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">On-Time</p>
                      <p className="text-lg font-semibold">{Number(team.on_time_rate).toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">vs Last Week</p>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(Number(team.week_over_week_change))}
                        <span
                          className={`text-sm font-semibold ${
                            Number(team.week_over_week_change) > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {Number(team.week_over_week_change) > 0 ? "+" : ""}
                          {Number(team.week_over_week_change).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

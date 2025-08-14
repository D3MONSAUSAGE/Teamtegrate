import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Target,
  Zap,
  Activity
} from "lucide-react";
import { format, subDays, isAfter, differenceInDays, parseISO } from 'date-fns';
import { Task } from '@/types';

interface TeamPerformanceMatrixProps {
  tasks: Task[];
  teamMembers: any[];
  timeRange: string;
  selectedUserIds?: string[];
}

interface PerformanceMetrics {
  memberId: string;
  memberName: string;
  memberEmail: string;
  avatar?: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionTime: number; // in days
  workloadScore: number; // 0-100
  productivityTrend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  projectCount: number;
  recentActivity: Array<{
    date: string;
    tasksCompleted: number;
  }>;
  qualityScore: number; // based on on-time completion
  collaborationScore: number; // based on cross-project work
}

const TeamPerformanceMatrix: React.FC<TeamPerformanceMatrixProps> = ({ 
  tasks, 
  teamMembers, 
  timeRange,
  selectedUserIds = []
}) => {
  const performanceData = useMemo(() => {
    console.log("🔄 Calculating performance data...");
    console.log("📊 Input - Tasks:", tasks.length, "Team Members:", teamMembers.length);
    console.log("👥 Selected User IDs:", selectedUserIds);
    
    const days = timeRange === "7 days" ? 7 : timeRange === "30 days" ? 30 : 90;
    const cutoffDate = subDays(new Date(), days);
    const recentTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt || task.updatedAt);
      return isAfter(taskDate, cutoffDate);
    });

    // Filter team members if selectedUserIds is provided and not empty
    const filteredMembers = selectedUserIds.length > 0 
      ? teamMembers.filter(member => selectedUserIds.includes(member.id))
      : teamMembers;
    
    console.log("👥 Filtered members:", filteredMembers.length, "of", teamMembers.length);

    const memberMetrics: PerformanceMetrics[] = filteredMembers.map(member => {
      // Get member's tasks
      const memberTasks = recentTasks.filter(task => 
        task.assignedToId === member.id || task.userId === member.id
      );

      const completedTasks = memberTasks.filter(task => task.status === 'Completed');
      const overdueTasks = memberTasks.filter(task => {
        if (task.deadline && task.status !== 'Completed') {
          const deadline = task.deadline instanceof Date ? task.deadline : parseISO(String(task.deadline));
          return differenceInDays(new Date(), deadline) > 0;
        }
        return false;
      });

      // Calculate completion rate
      const completionRate = memberTasks.length > 0 
        ? Math.round((completedTasks.length / memberTasks.length) * 100)
        : 0;

      // Calculate average completion time
      const avgCompletionTime = completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            if (task.deadline && task.completedAt) {
              const deadline = task.deadline instanceof Date ? task.deadline : parseISO(String(task.deadline));
              const completed = task.completedAt instanceof Date ? task.completedAt : parseISO(String(task.completedAt));
              const daysToComplete = differenceInDays(completed, new Date(task.createdAt || task.updatedAt));
              return sum + Math.max(1, daysToComplete);
            }
            return sum + 3; // default estimate
          }, 0) / completedTasks.length
        : 0;

      // Calculate workload score (0-100)
      const workloadScore = Math.min(100, (memberTasks.length / 15) * 100);

      // Determine productivity trend (simplified)
      const recentWeekTasks = memberTasks.filter(task => {
        const taskDate = new Date(task.createdAt || task.updatedAt);
        return isAfter(taskDate, subDays(new Date(), 7));
      });
      const olderTasks = memberTasks.filter(task => {
        const taskDate = new Date(task.createdAt || task.updatedAt);
        return !isAfter(taskDate, subDays(new Date(), 7));
      });

      const recentCompletionRate = recentWeekTasks.length > 0 
        ? (recentWeekTasks.filter(t => t.status === 'Completed').length / recentWeekTasks.length) * 100
        : 0;
      const olderCompletionRate = olderTasks.length > 0 
        ? (olderTasks.filter(t => t.status === 'Completed').length / olderTasks.length) * 100
        : 0;

      let productivityTrend: 'up' | 'down' | 'stable' = 'stable';
      if (recentCompletionRate > olderCompletionRate + 10) {
        productivityTrend = 'up';
      } else if (recentCompletionRate < olderCompletionRate - 10) {
        productivityTrend = 'down';
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (overdueTasks.length > 2 || completionRate < 60) {
        riskLevel = 'high';
      } else if (overdueTasks.length > 0 || completionRate < 80) {
        riskLevel = 'medium';
      }

      // Count unique projects
      const projectIds = new Set(memberTasks.map(task => task.projectId).filter(Boolean));
      const projectCount = projectIds.size;

      // Generate recent activity (simplified)
      const recentActivity = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayTasks = completedTasks.filter(task => {
          if (task.completedAt) {
            const completedDate = task.completedAt instanceof Date ? task.completedAt : parseISO(String(task.completedAt));
            return format(completedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          }
          return false;
        });
        return {
          date: format(date, 'MMM dd'),
          tasksCompleted: dayTasks.length
        };
      });

      // Calculate quality score (on-time completion)
      const onTimeCompletions = completedTasks.filter(task => {
        if (task.deadline && task.completedAt) {
          const deadline = task.deadline instanceof Date ? task.deadline : parseISO(String(task.deadline));
          const completed = task.completedAt instanceof Date ? task.completedAt : parseISO(String(task.completedAt));
          return completed <= deadline;
        }
        return true; // assume on-time if no deadline
      });
      const qualityScore = completedTasks.length > 0 
        ? Math.round((onTimeCompletions.length / completedTasks.length) * 100)
        : 100;

      // Calculate collaboration score (cross-project work)
      const collaborationScore = Math.min(100, projectCount * 25);

      return {
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        avatar: member.avatar_url,
        totalTasks: memberTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate,
        avgCompletionTime,
        workloadScore,
        productivityTrend,
        riskLevel,
        projectCount,
        recentActivity,
        qualityScore,
        collaborationScore
      };
    });

    // Sort by completion rate descending
    return memberMetrics.sort((a, b) => b.completionRate - a.completionRate);
  }, [tasks, teamMembers, timeRange, selectedUserIds]);

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const topPerformer = performanceData[0];
  const averageCompletion = performanceData.length > 0 
    ? Math.round(performanceData.reduce((sum, m) => sum + m.completionRate, 0) / performanceData.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{averageCompletion}%</div>
                <p className="text-xs text-muted-foreground">Avg Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{performanceData.filter(m => m.riskLevel === 'high').length}</div>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{performanceData.filter(m => m.productivityTrend === 'up').length}</div>
                <p className="text-xs text-muted-foreground">Improving</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{topPerformer?.memberName.split(' ')[0] || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">Top Performer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Team Performance Matrix
          </CardTitle>
          <CardDescription>
            Individual performance metrics for the last {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {performanceData.map((member, index) => (
              <Card key={member.memberId} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.memberName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && (
                          <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0" variant="default">
                            #1
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{member.memberName}</h4>
                        <p className="text-sm text-muted-foreground">{member.memberEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(member.productivityTrend)}
                      <Badge variant={getRiskColor(member.riskLevel)}>
                        {member.riskLevel} risk
                      </Badge>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{member.completionRate}%</div>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{member.totalTasks}</div>
                      <p className="text-xs text-muted-foreground">Total Tasks</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{member.completedTasks}</div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">{member.overdueTasks}</div>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{member.projectCount}</div>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Workload</span>
                        <span>{member.workloadScore}%</span>
                      </div>
                      <Progress value={member.workloadScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quality Score</span>
                        <span>{member.qualityScore}%</span>
                      </div>
                      <Progress value={member.qualityScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Collaboration</span>
                        <span>{member.collaborationScore}%</span>
                      </div>
                      <Progress value={member.collaborationScore} className="h-2" />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Assign Task
                    </Button>
                    {member.riskLevel === 'high' && (
                      <Button size="sm" variant="destructive">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Needs Attention
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPerformanceMatrix;
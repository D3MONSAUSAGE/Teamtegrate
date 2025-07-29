import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, User, Calendar } from "lucide-react";
import { format, differenceInDays, parseISO } from 'date-fns';
import { Task } from '@/types';

interface OverdueTasksAlertProps {
  tasks: Task[];
  teamMembers: any[];
  onTaskReassign?: (taskId: string, newAssigneeId: string) => void;
  onBulkExtend?: (taskIds: string[], days: number) => void;
}

interface OverdueTaskData {
  taskId: string;
  title: string;
  assigneeId: string;
  assigneeName: string;
  deadline: string;
  daysOverdue: number;
  priority: string;
  projectTitle?: string;
}

interface TeamMemberOverdue {
  memberId: string;
  memberName: string;
  memberEmail: string;
  avatar?: string;
  overdueTasks: OverdueTaskData[];
  totalOverdue: number;
  criticalOverdue: number; // >7 days
  severityScore: number;
}

const OverdueTasksAlert: React.FC<OverdueTasksAlertProps> = ({
  tasks,
  teamMembers,
  onTaskReassign,
  onBulkExtend
}) => {
  const overdueAnalysis = useMemo(() => {
    const now = new Date();
    const overdueTasksData: OverdueTaskData[] = [];
    
    // Find all overdue tasks
    tasks.forEach(task => {
        if (task.deadline && task.status !== 'Completed') {
          const deadline = task.deadline instanceof Date ? task.deadline : parseISO(String(task.deadline));
          const daysOverdue = differenceInDays(now, deadline);
        
        if (daysOverdue > 0) {
          const assigneeId = task.assignedToId || task.userId;
          const assignee = teamMembers.find(m => m.id === assigneeId);
          
          overdueTasksData.push({
            taskId: task.id,
            title: task.title || 'Untitled Task',
            assigneeId: assigneeId || 'unassigned',
            assigneeName: assignee?.name || 'Unassigned',
            deadline: task.deadline instanceof Date ? task.deadline.toISOString() : String(task.deadline),
            daysOverdue,
            priority: task.priority || 'Medium',
            projectTitle: undefined // Will need to be populated separately from projects data
          });
        }
      }
    });

    // Group by team member
    const memberMap = new Map<string, TeamMemberOverdue>();
    
    overdueTasksData.forEach(taskData => {
      const memberId = taskData.assigneeId;
      const member = teamMembers.find(m => m.id === memberId);
      
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, {
          memberId,
          memberName: taskData.assigneeName,
          memberEmail: member?.email || '',
          avatar: member?.avatar_url,
          overdueTasks: [],
          totalOverdue: 0,
          criticalOverdue: 0,
          severityScore: 0
        });
      }
      
      const memberData = memberMap.get(memberId)!;
      memberData.overdueTasks.push(taskData);
      memberData.totalOverdue++;
      
      if (taskData.daysOverdue > 7) {
        memberData.criticalOverdue++;
      }
      
      // Calculate severity score (weighted by days overdue and priority)
      const priorityWeight = taskData.priority === 'High' ? 3 : taskData.priority === 'Medium' ? 2 : 1;
      memberData.severityScore += taskData.daysOverdue * priorityWeight;
    });

    // Sort by severity score
    const sortedMembers = Array.from(memberMap.values())
      .sort((a, b) => b.severityScore - a.severityScore);

    return {
      totalOverdue: overdueTasksData.length,
      unassignedTasks: overdueTasksData.filter(t => t.assigneeId === 'unassigned').length,
      criticalTasks: overdueTasksData.filter(t => t.daysOverdue > 7).length,
      teamMembersWithOverdue: sortedMembers,
      highPriorityOverdue: overdueTasksData.filter(t => t.priority === 'High').length
    };
  }, [tasks, teamMembers]);

  const getSeverityColor = (severityScore: number) => {
    if (severityScore > 50) return 'destructive';
    if (severityScore > 20) return 'secondary';
    return 'outline';
  };

  const getSeverityBadge = (daysOverdue: number) => {
    if (daysOverdue > 14) return { variant: 'destructive' as const, label: 'Critical' };
    if (daysOverdue > 7) return { variant: 'secondary' as const, label: 'High Risk' };
    if (daysOverdue > 3) return { variant: 'outline' as const, label: 'At Risk' };
    return { variant: 'outline' as const, label: 'Overdue' };
  };

  if (overdueAnalysis.totalOverdue === 0) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-success flex items-center gap-2">
            <Clock className="h-5 w-5" />
            No Overdue Tasks
          </CardTitle>
          <CardDescription>All team tasks are on track!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Alert */}
      <Alert className="border-destructive/50 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>{overdueAnalysis.totalOverdue} overdue tasks</strong> across {overdueAnalysis.teamMembersWithOverdue.length} team members. 
          {overdueAnalysis.criticalTasks > 0 && (
            <span className="font-semibold"> {overdueAnalysis.criticalTasks} critically overdue (&gt;7 days).</span>
          )}
          {overdueAnalysis.unassignedTasks > 0 && (
            <span className="font-semibold"> {overdueAnalysis.unassignedTasks} unassigned tasks need immediate attention.</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{overdueAnalysis.totalOverdue}</div>
            <p className="text-xs text-muted-foreground">Total Overdue</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{overdueAnalysis.criticalTasks}</div>
            <p className="text-xs text-muted-foreground">Critical (&gt;7d)</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{overdueAnalysis.highPriorityOverdue}</div>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card className="border-muted">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">{overdueAnalysis.unassignedTasks}</div>
            <p className="text-xs text-muted-foreground">Unassigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Overdue Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Team Members with Overdue Tasks
          </CardTitle>
          <CardDescription>
            Sorted by severity score (impact × days overdue)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {overdueAnalysis.teamMembersWithOverdue.map(member => (
            <div key={member.memberId} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.memberName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{member.memberName}</h4>
                    <p className="text-sm text-muted-foreground">{member.memberEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getSeverityColor(member.severityScore)}>
                    {member.totalOverdue} overdue
                  </Badge>
                  {member.criticalOverdue > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {member.criticalOverdue} critical
                    </Badge>
                  )}
                </div>
              </div>

              {/* Severity Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Risk Level</span>
                  <span>Score: {member.severityScore}</span>
                </div>
                <Progress 
                  value={Math.min(100, (member.severityScore / 100) * 100)} 
                  className="h-2"
                />
              </div>

              {/* Individual Overdue Tasks */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Overdue Tasks:</h5>
                {member.overdueTasks.slice(0, 3).map(task => {
                  const severityBadge = getSeverityBadge(task.daysOverdue);
                  return (
                    <div key={task.taskId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {format(parseISO(task.deadline), 'MMM dd')}</span>
                          {task.projectTitle && (
                            <span>• {task.projectTitle}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={severityBadge.variant} className="text-xs">
                          {task.daysOverdue}d {severityBadge.label}
                        </Badge>
                        {task.priority === 'High' && (
                          <Badge variant="destructive" className="text-xs">High</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {member.overdueTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{member.overdueTasks.length - 3} more overdue tasks
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline">
                  Contact Member
                </Button>
                <Button size="sm" variant="outline">
                  Reassign Tasks
                </Button>
                <Button size="sm" variant="outline">
                  Extend Deadlines
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverdueTasksAlert;
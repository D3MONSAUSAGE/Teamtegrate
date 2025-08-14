import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserSelector } from "@/components/ui/user-selector";
import { 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Clock,
  Target,
  BarChart3,
  Shield,
  Bell
} from "lucide-react";
import OverdueTasksAlert from './OverdueTasksAlert';
import TeamPerformanceMatrix from './TeamPerformanceMatrix';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { format, subDays, isAfter, differenceInDays, parseISO } from 'date-fns';

interface ManagerDashboardProps {
  timeRange: string;
  teamMembers: any[];
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  timeRange,
  teamMembers
}) => {
  const { user } = useAuth();
  const { tasks, projects } = useTask();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Filter tasks based on user role and organization
  const accessibleTasks = useMemo(() => {
    if (!user) return [];
    
    // Superadmin and Admin can see all tasks in their organization
    if (user.role === 'superadmin' || user.role === 'admin') {
      return tasks;
    }
    
    // Managers can see all tasks in their organization
    if (user.role === 'manager') {
      return tasks;
    }
    
    // Regular users only see their own tasks
    return tasks.filter(task => 
      task.userId === user.id || 
      task.assignedToId === user.id ||
      (task.assignedToIds && task.assignedToIds.includes(user.id))
    );
  }, [tasks, user]);

  // Calculate key metrics
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const days = timeRange === "7 days" ? 7 : timeRange === "30 days" ? 30 : 90;
    const cutoffDate = subDays(now, days);
    
    const recentTasks = accessibleTasks.filter(task => {
      const taskDate = new Date(task.createdAt || task.updatedAt);
      return isAfter(taskDate, cutoffDate);
    });

    const overdueTasks = accessibleTasks.filter(task => {
      if (task.deadline && task.status !== 'Completed') {
        const deadline = task.deadline instanceof Date ? task.deadline : parseISO(String(task.deadline));
        return differenceInDays(now, deadline) > 0;
      }
      return false;
    });

    const completedTasks = recentTasks.filter(task => task.status === 'Completed');
    const highPriorityTasks = recentTasks.filter(task => task.priority === 'High');
    const unassignedTasks = accessibleTasks.filter(task => 
      !task.assignedToId && !task.userId
    );

    // Team performance summary
    const teamMembersWithTasks = teamMembers.filter(member => 
      accessibleTasks.some(task => 
        task.assignedToId === member.id || task.userId === member.id
      )
    );

    const atRiskMembers = teamMembersWithTasks.filter(member => {
      const memberOverdue = overdueTasks.filter(task => 
        task.assignedToId === member.id || task.userId === member.id
      );
      return memberOverdue.length > 2;
    });

    // Project health
    const activeProjects = projects.filter(p => p.status !== 'Completed');
    const projectsWithOverdue = activeProjects.filter(project => 
      overdueTasks.some(task => task.projectId === project.id)
    );

    return {
      totalTasks: recentTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      highPriorityTasks: highPriorityTasks.length,
      unassignedTasks: unassignedTasks.length,
      completionRate: recentTasks.length > 0 ? Math.round((completedTasks.length / recentTasks.length) * 100) : 0,
      teamMembersActive: teamMembersWithTasks.length,
      atRiskMembers: atRiskMembers.length,
      activeProjects: activeProjects.length,
      projectsAtRisk: projectsWithOverdue.length
    };
  }, [accessibleTasks, projects, teamMembers, timeRange]);

  // Check if user has manager+ permissions
  const hasManagerAccess = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);

  // Filter team members based on role permissions for user selection
  const selectableUsers = useMemo(() => {
    if (!user) return [];
    
    // Convert team members to the format expected by UserSelector
    const users = teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.avatar
    }));

    // Apply role-based filtering
    if (user.role === 'superadmin' || user.role === 'admin') {
      // Superadmin and Admin can see all users in their organization
      return users;
    } else if (user.role === 'manager') {
      // Managers can see all users in their organization
      return users;
    } else {
      // Regular users can only see themselves
      return users.filter(u => u.id === user.id);
    }
  }, [teamMembers, user]);

  if (!hasManagerAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Restricted
          </CardTitle>
          <CardDescription>
            Manager-level access required to view team analytics and overdue task management.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {dashboardMetrics.overdueTasks > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Immediate Attention Required
            </CardTitle>
            <CardDescription>
              {dashboardMetrics.overdueTasks} overdue tasks across {dashboardMetrics.atRiskMembers} at-risk team members.
              {dashboardMetrics.unassignedTasks > 0 && (
                <span className="font-semibold"> {dashboardMetrics.unassignedTasks} unassigned tasks need owners.</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{dashboardMetrics.completionRate}%</div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-destructive">{dashboardMetrics.overdueTasks}</div>
                <p className="text-xs text-muted-foreground">Overdue Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-warning" />
              <div>
                <div className="text-2xl font-bold text-warning">{dashboardMetrics.atRiskMembers}</div>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{dashboardMetrics.activeProjects}</div>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{dashboardMetrics.unassignedTasks}</div>
                <p className="text-xs text-muted-foreground">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{dashboardMetrics.teamMembersActive}</div>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Tasks</TabsTrigger>
          <TabsTrigger value="performance">Performance Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Overdue Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue Tasks Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardMetrics.atRiskMembers > 0 ? (
                    <div className="flex justify-between items-center">
                      <span>Team members at risk:</span>
                      <Badge variant="destructive">{dashboardMetrics.atRiskMembers}</Badge>
                    </div>
                  ) : (
                    <div className="text-success text-center py-4">
                      ✓ No team members currently at risk
                    </div>
                  )}
                  <Button 
                    onClick={() => setActiveTab("overdue")} 
                    className="w-full"
                    variant={dashboardMetrics.overdueTasks > 0 ? "destructive" : "outline"}
                  >
                    View Detailed Overdue Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Team completion rate:</span>
                    <Badge variant={dashboardMetrics.completionRate >= 80 ? "default" : "secondary"}>
                      {dashboardMetrics.completionRate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active team members:</span>
                    <Badge variant="outline">{dashboardMetrics.teamMembersActive}</Badge>
                  </div>
                  <Button 
                    onClick={() => setActiveTab("performance")} 
                    className="w-full"
                    variant="outline"
                  >
                    View Performance Matrix
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <OverdueTasksAlert 
            tasks={accessibleTasks}
            teamMembers={teamMembers}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* User Selection for Performance Matrix */}
          {selectableUsers.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Member Selection</CardTitle>
                <CardDescription>
                  Select up to 4 team members to display in the performance matrix. Leave empty to show all members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserSelector
                  users={selectableUsers}
                  selectedUserIds={selectedUserIds}
                  onSelectionChange={setSelectedUserIds}
                  maxSelection={4}
                  placeholder="Select team members to display..."
                />
                {selectedUserIds.length > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Showing {selectedUserIds.length} of {teamMembers.length} team members
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <TeamPerformanceMatrix 
            tasks={accessibleTasks}
            teamMembers={teamMembers}
            timeRange={timeRange}
            selectedUserIds={selectedUserIds}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard;
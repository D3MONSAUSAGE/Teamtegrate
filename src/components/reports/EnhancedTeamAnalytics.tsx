import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, User, ChevronRight, Clock, Target, AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  projects: number;
  recentActivity: Array<{
    date: string;
    tasksCompleted: number;
  }>;
  workloadScore: number;
  qualityScore: number;
  collaborationScore: number;
}

interface EnhancedTeamAnalyticsProps {
  teamMembers: TeamMember[];
}

const EnhancedTeamAnalytics: React.FC<EnhancedTeamAnalyticsProps> = ({ teamMembers }) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [sortBy, setSortBy] = useState<'completionRate' | 'totalTasks' | 'projects'>('completionRate');

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { label: "Excellent", color: "bg-emerald-500", textColor: "text-emerald-700" };
    if (rate >= 75) return { label: "Good", color: "bg-blue-500", textColor: "text-blue-700" };
    if (rate >= 60) return { label: "Average", color: "bg-yellow-500", textColor: "text-yellow-700" };
    return { label: "Needs Attention", color: "bg-red-500", textColor: "text-red-700" };
  };

  const getWorkloadStatus = (score: number) => {
    if (score >= 80) return { status: "Overloaded", color: "text-red-600", icon: AlertTriangle };
    if (score >= 60) return { status: "Optimal", color: "text-emerald-600", icon: Target };
    return { status: "Underutilized", color: "text-yellow-600", icon: Clock };
  };

  const sortedMembers = [...teamMembers].sort((a, b) => b[sortBy] - a[sortBy]);

  const teamProductivityData = teamMembers.map((member, index) => ({
    name: member.name.split(' ')[0],
    productivity: member.completionRate,
    workload: member.workloadScore,
    quality: member.qualityScore,
    collaboration: member.collaborationScore
  }));

  const distributionData = [
    { name: "Excellent (90%+)", value: teamMembers.filter(m => m.completionRate >= 90).length, color: "#10b981" },
    { name: "Good (75-89%)", value: teamMembers.filter(m => m.completionRate >= 75 && m.completionRate < 90).length, color: "#3b82f6" },
    { name: "Average (60-74%)", value: teamMembers.filter(m => m.completionRate >= 60 && m.completionRate < 75).length, color: "#f59e0b" },
    { name: "Below Average (<60%)", value: teamMembers.filter(m => m.completionRate < 60).length, color: "#ef4444" }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg dark:bg-blue-950/20">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Performer</p>
                <p className="font-semibold">{sortedMembers[0]?.name.split(' ')[0] || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg dark:bg-emerald-950/20">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Completion</p>
                <p className="font-semibold">{Math.round(teamMembers.reduce((sum, m) => sum + m.completionRate, 0) / teamMembers.length)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg dark:bg-purple-950/20">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Performers</p>
                <p className="font-semibold">{teamMembers.filter(m => m.completionRate >= 85).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg dark:bg-orange-950/20">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Need Support</p>
                <p className="font-semibold">{teamMembers.filter(m => m.completionRate < 60).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Matrix</CardTitle>
          <p className="text-sm text-muted-foreground">Multi-dimensional performance view</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="productivity" fill="#3b82f6" name="Completion Rate %" />
                <Bar dataKey="quality" fill="#10b981" name="Quality Score" />
                <Bar dataKey="collaboration" fill="#8b5cf6" name="Collaboration Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {distributionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Member List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completionRate">Completion Rate</SelectItem>
                  <SelectItem value="totalTasks">Total Tasks</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedMembers.map((member, index) => {
                const performance = getPerformanceLevel(member.completionRate);
                const workload = getWorkloadStatus(member.workloadScore);
                const WorkloadIcon = workload.icon;

                return (
                  <Dialog key={member.id}>
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="text-sm font-semibold">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{member.name}</p>
                              {index === 0 && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <Badge className={cn("text-white", performance.color)}>
                                {member.completionRate}%
                              </Badge>
                              <div className="flex items-center gap-1">
                                <WorkloadIcon className={cn("w-3 h-3", workload.color)} />
                                <span className={cn("text-xs", workload.color)}>
                                  {workload.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.completedTasks}/{member.totalTasks}</p>
                          <p className="text-xs text-muted-foreground">{member.projects} projects</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {member.name}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Completion Rate</p>
                            <p className="text-2xl font-bold">{member.completionRate}%</p>
                            <Progress value={member.completionRate} className="h-2" />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Quality Score</p>
                            <p className="text-2xl font-bold">{member.qualityScore}</p>
                            <Progress value={member.qualityScore} className="h-2" />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Collaboration</p>
                            <p className="text-2xl font-bold">{member.collaborationScore}</p>
                            <Progress value={member.collaborationScore} className="h-2" />
                          </div>
                        </div>

                        {/* Recent Activity Chart */}
                        <div>
                          <h4 className="font-semibold mb-3">Recent Activity (Last 7 Days)</h4>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={member.recentActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line 
                                  type="monotone" 
                                  dataKey="tasksCompleted" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  dot={{ fill: '#3b82f6' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Task Summary */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Tasks Completed</p>
                            <p className="text-xl font-bold text-emerald-600">{member.completedTasks}</p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Active Projects</p>
                            <p className="text-xl font-bold text-blue-600">{member.projects}</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedTeamAnalytics;
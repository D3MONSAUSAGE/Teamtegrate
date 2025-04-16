
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTask } from '@/contexts/task';
import { Task } from '@/types';

// Mock team members data (in a real app, this would come from an API)
const mockTeamMembers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Designer' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Developer' },
  { id: '3', name: 'Robert Johnson', email: 'robert@example.com', role: 'Project Manager' },
  { id: '4', name: 'Emily Davis', email: 'emily@example.com', role: 'QA Engineer' },
];

const TeamPage = () => {
  const { tasks, projects } = useTask();
  
  // Calculate completion rates and assigned tasks for each member
  const teamPerformance = mockTeamMembers.map((member) => {
    const assignedTasks = tasks.filter(task => task.assignedToId === member.id);
    
    const completedTasks = assignedTasks.filter(task => task.status === 'Completed');
    
    const completionRate = assignedTasks.length > 0
      ? Math.round((completedTasks.length / assignedTasks.length) * 100)
      : 0;
    
    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueTodayTasks = assignedTasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    // Get projects this member is involved in
    const memberProjects = projects.filter(project => 
      project.tasks.some(task => task.assignedToId === member.id)
    );
    
    return {
      ...member,
      assignedTasks,
      completedTasks: completedTasks.length,
      totalTasks: assignedTasks.length,
      completionRate,
      dueTodayTasks: dueTodayTasks.length,
      projects: memberProjects.length,
    };
  });
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <Button>Invite Team Member</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTeamMembers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamPerformance.reduce((sum, member) => sum + member.totalTasks, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamPerformance.reduce((sum, member) => sum + member.completedTasks, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Team Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamPerformance.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                </div>
                <Badge variant="outline">{member.totalTasks} Tasks</Badge>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Task Completion</span>
                    <span className="font-medium">{member.completionRate}%</span>
                  </div>
                  <Progress value={member.completionRate} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2 rounded-md">
                    <div className="text-xs text-gray-500">Due Today</div>
                    <div className="font-semibold">{member.dueTodayTasks}</div>
                  </div>
                  
                  <div className="bg-purple-50 p-2 rounded-md">
                    <div className="text-xs text-gray-500">Projects</div>
                    <div className="font-semibold">{member.projects}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;

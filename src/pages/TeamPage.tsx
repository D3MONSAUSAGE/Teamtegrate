
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from 'lucide-react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import AddTeamMemberDialog from '@/components/AddTeamMemberDialog';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  managerId: string;
}

const TeamPage = () => {
  const { tasks, projects } = useTask();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  
  // Load team members from localStorage on component mount
  useEffect(() => {
    const storedMembers = localStorage.getItem('teamMembers');
    if (storedMembers) {
      setTeamMembers(JSON.parse(storedMembers));
    }
  }, []);
  
  // Function to remove a team member
  const handleRemoveTeamMember = (memberId: string) => {
    const updatedMembers = teamMembers.filter(member => member.id !== memberId);
    localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
    setTeamMembers(updatedMembers);
    toast.success('Team member removed successfully');
  };
  
  // Function to refresh team members list
  const handleTeamMemberAdded = () => {
    const storedMembers = localStorage.getItem('teamMembers');
    if (storedMembers) {
      setTeamMembers(JSON.parse(storedMembers));
    }
  };
  
  // Calculate completion rates and assigned tasks for each member
  const teamPerformance = teamMembers.map((member) => {
    const assignedTasks = tasks.filter(task => task.assignedToId === member.id);
    
    const completedTasks = assignedTasks.filter(task => task.status === 'Completed');
    
    const completionRate = assignedTasks.length > 0
      ? Math.round((completedTasks.length / assignedTasks.length) * 100)
      : 0;
    
    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
        <Button onClick={() => setIsAddMemberOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Team Member
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
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
      
      <h2 className="text-xl font-semibold mb-4">Team Members</h2>
      
      {teamMembers.length === 0 ? (
        <Card className="py-8">
          <div className="text-center text-muted-foreground">
            <p>No team members yet. Add your first team member to get started.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsAddMemberOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Team Member
            </Button>
          </div>
        </Card>
      ) : (
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
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500">{member.role}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline">{member.totalTasks} Tasks</Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                      onClick={() => handleRemoveTeamMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
      )}
      
      <AddTeamMemberDialog 
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onTeamMemberAdded={handleTeamMemberAdded}
      />
    </div>
  );
};

export default TeamPage;

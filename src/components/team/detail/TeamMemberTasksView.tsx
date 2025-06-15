
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  User,
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TeamMemberTasksViewProps {
  teamId: string;
  teamMembers: any[];
}

// Helper functions moved outside component to avoid scoping issues
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'destructive';
    case 'Medium': return 'default';
    case 'Low': return 'secondary';
    default: return 'outline';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed': return <CheckSquare className="h-4 w-4 text-green-500" />;
    case 'In Progress': return <Clock className="h-4 w-4 text-blue-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const TeamMemberTasksView: React.FC<TeamMemberTasksViewProps> = ({ teamId, teamMembers }) => {
  const { user } = useAuth();
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  const { data: memberTasksData = [], isLoading } = useQuery({
    queryKey: ['team-member-tasks', teamId, user?.organizationId],
    queryFn: async () => {
      if (!teamId || !user?.organizationId || teamMembers.length === 0) return [];
      
      const memberIds = teamMembers.map(m => m.user_id);
      
      // Fetch tasks assigned to team members
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', user.organizationId)
        .or(`user_id.in.(${memberIds.join(',')}),assigned_to_id.in.(${memberIds.join(',')}),assigned_to_ids.cs.{${memberIds.join(',')}}`);

      if (error) throw error;
      
      // Group tasks by member
      const tasksByMember = memberIds.reduce((acc, memberId) => {
        acc[memberId] = (tasks || []).filter(task => 
          task.user_id === memberId || 
          task.assigned_to_id === memberId || 
          (task.assigned_to_ids && task.assigned_to_ids.includes(memberId))
        );
        return acc;
      }, {} as Record<string, any[]>);
      
      return tasksByMember;
    },
    enabled: !!teamId && !!user?.organizationId && teamMembers.length > 0,
  });

  const toggleMemberExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Team Member Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : teamMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No team members to show tasks for.</p>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((membership) => {
              const memberTasks = memberTasksData[membership.user_id] || [];
              const isExpanded = expandedMembers.has(membership.user_id);
              const completedTasks = memberTasks.filter(t => t.status === 'Completed').length;
              const inProgressTasks = memberTasks.filter(t => t.status === 'In Progress').length;
              const todoTasks = memberTasks.filter(t => t.status === 'To Do').length;

              return (
                <Collapsible key={membership.user_id}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-muted/50"
                      onClick={() => toggleMemberExpansion(membership.user_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{membership.users.name || membership.users.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {memberTasks.length} total tasks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {completedTasks > 0 && (
                            <Badge variant="default" className="text-xs">
                              {completedTasks} done
                            </Badge>
                          )}
                          {inProgressTasks > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {inProgressTasks} in progress
                            </Badge>
                          )}
                          {todoTasks > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {todoTasks} todo
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-2">
                    {memberTasks.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No tasks assigned to this member
                      </div>
                    ) : (
                      <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="all">All ({memberTasks.length})</TabsTrigger>
                          <TabsTrigger value="todo">To Do ({todoTasks})</TabsTrigger>
                          <TabsTrigger value="progress">In Progress ({inProgressTasks})</TabsTrigger>
                          <TabsTrigger value="completed">Done ({completedTasks})</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all" className="space-y-2 mt-4">
                          {memberTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </TabsContent>
                        
                        <TabsContent value="todo" className="space-y-2 mt-4">
                          {memberTasks.filter(t => t.status === 'To Do').map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </TabsContent>
                        
                        <TabsContent value="progress" className="space-y-2 mt-4">
                          {memberTasks.filter(t => t.status === 'In Progress').map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </TabsContent>
                        
                        <TabsContent value="completed" className="space-y-2 mt-4">
                          {memberTasks.filter(t => t.status === 'Completed').map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </TabsContent>
                      </Tabs>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Task card component for displaying individual tasks
const TaskCard: React.FC<{ task: any }> = ({ task }) => {
  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="font-medium line-clamp-1">{task.title}</h5>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {getStatusIcon(task.status)}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
            {task.priority}
          </Badge>
          {task.deadline && (
            <span className="text-muted-foreground">
              Due: {format(new Date(task.deadline), 'MMM d')}
            </span>
          )}
        </div>
        {task.cost && task.cost > 0 && (
          <span className="text-muted-foreground">
            ${task.cost}
          </span>
        )}
      </div>
    </div>
  );
};

export default TeamMemberTasksView;

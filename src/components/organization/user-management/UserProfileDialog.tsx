
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Briefcase,
  Target,
  TrendingUp,
  List,
  Folder
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  userId,
  open,
  onOpenChange
}) => {
  const { profileData, loading, error, canViewProfile } = useUserProfile(userId);

  if (!canViewProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              You don't have permission to view user profiles.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !profileData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {error || 'Failed to load user profile'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { user, tasks, projects, stats } = profileData;
  const userName = user.name || user.email.split('@')[0];
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300';
      case 'admin': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300';
      case 'manager': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'To Do': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span>{userName}</span>
                <Badge className={getRoleColor(user.role)}>
                  {user.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-normal">{user.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <List className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">{stats.overdueTasks}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Folder className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">{stats.activeProjects}</div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="font-medium">{userName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Joined</label>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <List className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No tasks assigned to this user</p>
                    </CardContent>
                  </Card>
                ) : (
                  tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {task.deadline && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                                </div>
                              )}
                              {task.cost && task.cost > 0 && (
                                <div className="flex items-center gap-1">
                                  <Target className="h-4 w-4" />
                                  ${task.cost}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <div className="space-y-3">
                {projects.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">User is not involved in any projects</p>
                    </CardContent>
                  </Card>
                ) : (
                  projects.map((project) => (
                    <Card key={project.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{project.title}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              {project.is_manager && (
                                <Badge variant="outline" className="text-xs">
                                  Manager
                                </Badge>
                              )}
                              {project.is_team_member && (
                                <Badge variant="outline" className="text-xs">
                                  Team Member
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;

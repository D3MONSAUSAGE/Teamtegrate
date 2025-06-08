
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckSquare, MessageSquare, FolderKanban } from 'lucide-react';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const ProfileActivity = () => {
  const { tasks, projects } = useTask();
  const { user } = useAuth();

  if (!user) return null;

  // Get user's recent tasks (last 5)
  const userTasks = tasks
    .filter(task => task.userId === user.id || task.assignedToId === user.id)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5);

  // Create a map of project IDs to project titles for quick lookup
  const projectMap = new Map();
  projects.forEach(project => {
    projectMap.set(project.id, project.title);
  });

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'In Progress':
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <FolderKanban className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Todo':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userTasks.length > 0 ? (
            userTasks.map((task) => {
              const projectTitle = task.projectId ? projectMap.get(task.projectId) : null;
              
              return (
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getActivityIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {projectTitle && `${projectTitle} • `}
                          {format(new Date(task.updatedAt || task.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(task.status)} className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileActivity;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Folder, Calendar, Users, TrendingUp } from 'lucide-react';
import { Project } from '@/types';
import { format } from 'date-fns';

interface RecentProjectsProps {
  projects: Project[];
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ projects }) => {
  const recentProjects = projects.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      case 'in progress':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'planning':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      default:
        return 'bg-gradient-to-r from-slate-500 to-gray-500 text-white';
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/30">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="flex items-center gap-3">
          <Folder className="h-5 w-5" />
          <CardTitle className="text-lg">Active Projects</CardTitle>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {projects.length} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {recentProjects.length > 0 ? (
          <div className="space-y-6">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="p-5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 dark:hover:bg-slate-700/60 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(project.status)} border-0 shadow-sm ml-4`}>
                    {project.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {project.progress || 0}% Complete
                      </span>
                    </div>
                    <Progress 
                      value={project.progress || 0} 
                      className="h-2 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>

                  {/* Project Stats */}
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Due: {project.endDate ? format(new Date(project.endDate), 'MMM dd') : 'No deadline'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{project.tasksCount || 0} tasks</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-4">
                <Folder className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No projects yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Create your first project to organize your tasks and collaborate with your team.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentProjects;

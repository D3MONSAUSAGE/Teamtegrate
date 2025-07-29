import React from 'react';
import { Timeline } from '@/components/ui/timeline';
import { useProjectTimeline, TimelineEvent } from './hooks/useProjectTimeline';
import { Task, Project, TaskComment, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ProjectTimelineProps {
  project: Project;
  tasks: Task[];
  teamMembers: User[];
  comments?: TaskComment[];
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  project,
  tasks,
  teamMembers,
  comments = []
}) => {
  const { timelineEvents, projectHealth } = useProjectTimeline({
    project,
    tasks,
    teamMembers,
    comments
  });

  const getEventStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'upcoming':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted border-muted';
    }
  };

  const getHealthStatusIcon = () => {
    switch (projectHealth.status) {
      case 'on_track':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getHealthStatusText = () => {
    switch (projectHealth.status) {
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'critical':
        return 'Critical';
    }
  };

  const getHealthStatusColor = () => {
    switch (projectHealth.status) {
      case 'on_track':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  // Transform timeline events for the Timeline component
  const timelineData = timelineEvents.map((event, index) => ({
    title: format(event.date, 'MMM dd, yyyy'),
    content: (
      <div key={event.id} className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{event.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground">{event.title}</h4>
              <Badge 
                variant="outline" 
                className={`text-xs ${getEventStatusColor(event.status)}`}
              >
                {event.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{event.description}</p>
            {event.metadata && (
              <div className="mt-2 text-xs text-muted-foreground">
                {event.type === 'task_completed' && event.metadata.priority && (
                  <span>Priority: {event.metadata.priority}</span>
                )}
                {event.type === 'budget_update' && event.metadata.budgetSpent && (
                  <span>
                    ${event.metadata.budgetSpent.toLocaleString()} / ${event.metadata.budget.toLocaleString()}
                  </span>
                )}
                {event.type === 'comment' && event.metadata.userName && (
                  <span>By: {event.metadata.userName}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }));

  return (
    <div className="space-y-6">
      {/* Project Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Project Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthStatusIcon()}
              <span className={`text-sm font-medium ${getHealthStatusColor()}`}>
                {getHealthStatusText()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{projectHealth.completedTasks} of {projectHealth.totalTasks} tasks</span>
                <span>{projectHealth.taskProgress.toFixed(0)}%</span>
              </div>
              <Progress value={projectHealth.taskProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {projectHealth.daysRemaining > 0 
                    ? `${projectHealth.daysRemaining} days left`
                    : `${Math.abs(projectHealth.daysRemaining)} days overdue`
                  }
                </span>
                <span>{projectHealth.timeProgress.toFixed(0)}%</span>
              </div>
              <Progress value={projectHealth.timeProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <Timeline data={timelineData} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No timeline events yet</p>
              <p className="text-sm">Events will appear as the project progresses</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTimeline;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Clock,
  Play,
  Calendar,
  AlertTriangle,
  FileText,
  ExternalLink,
  Info
} from 'lucide-react';
import { OnboardingTaskStatus } from '@/types/onboarding';
import { format } from 'date-fns';

interface WizardTaskCardProps {
  task: any;
  onComplete: (taskId: string) => Promise<void>;
  onStart: (taskId: string) => Promise<void>;
  isUpdating: boolean;
}

export function WizardTaskCard({ task, onComplete, onStart, isUpdating }: WizardTaskCardProps) {
  const getStatusInfo = (status: OnboardingTaskStatus) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Completed'
        };
      case 'in_progress':
        return {
          icon: Play,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'In Progress'
        };
      case 'blocked':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Blocked'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Pending'
        };
    }
  };

  const statusInfo = getStatusInfo(task.status);
  const StatusIcon = statusInfo.icon;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card className={`${isOverdue ? 'border-red-200 bg-red-50' : ''} transition-all hover:shadow-md`}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
                <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
              </div>
              <CardTitle className="text-xl">{task.title}</CardTitle>
            </div>
            {task.description && (
              <p className="text-muted-foreground leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
          >
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Task Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {task.due_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`} />
              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                Due {format(new Date(task.due_date), 'MMMM d, yyyy')}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span className="capitalize">Owner: {task.owner_type?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Instructions */}
        {task.instructions && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Instructions
            </h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed">{task.instructions}</p>
            </div>
          </div>
        )}

        {/* Resources */}
        {task.resources && task.resources.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Resources</h4>
            <div className="space-y-2">
              {task.resources.map((resource: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{resource.title}</span>
                  </div>
                  {resource.url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Notes */}
        {task.notes && (
          <div className="space-y-2">
            <h4 className="font-medium">Notes</h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">{task.notes}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          {task.status === 'pending' && (
            <Button
              onClick={() => onStart(task.id)}
              disabled={isUpdating}
              className="flex-1 max-w-xs"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Task
            </Button>
          )}
          
          {task.status === 'in_progress' && (
            <Button
              onClick={() => onComplete(task.id)}
              disabled={isUpdating}
              className="flex-1 max-w-xs"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
          
          {task.status === 'completed' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Task Completed!</span>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Need help with this task? Contact your manager or HR team.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
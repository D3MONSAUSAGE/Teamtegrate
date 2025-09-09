import React from 'react';
import { Request } from '@/types/requests';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText,
  Calendar,
  Timer,
  UserCheck
} from 'lucide-react';
import { format, isAfter } from 'date-fns';

interface EnhancedRequestCardProps {
  request: Request;
  onView?: (request: Request) => void;
  onAssign?: (request: Request) => void;
  onStatusChange?: (request: Request, status: string) => void;
}

export const EnhancedRequestCard: React.FC<EnhancedRequestCardProps> = ({
  request,
  onView,
  onAssign,
  onStatusChange
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle,
          bg: 'border-l-emerald-500',
          textColor: 'text-emerald-700'
        };
      case 'rejected':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          bg: 'border-l-red-500',
          textColor: 'text-red-700'
        };
      case 'under_review':
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertCircle,
          bg: 'border-l-amber-500',
          textColor: 'text-amber-700'
        };
      case 'submitted':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: FileText,
          bg: 'border-l-blue-500',
          textColor: 'text-blue-700'
        };
      case 'completed':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: CheckCircle,
          bg: 'border-l-green-500',
          textColor: 'text-green-700'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: FileText,
          bg: 'border-l-gray-500',
          textColor: 'text-gray-700'
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const isOverdue = request.due_date && isAfter(new Date(), new Date(request.due_date));
  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`hover:shadow-md transition-all duration-200 border-l-4 ${statusConfig.bg} ${isOverdue ? 'bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {request.ticket_number && (
                <Badge variant="outline" className="font-mono text-xs">
                  {request.ticket_number}
                </Badge>
              )}
              <Badge className={getPriorityConfig(request.priority)}>
                {request.priority.toUpperCase()}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="animate-pulse">
                  OVERDUE
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg leading-none">{request.title}</h3>
            {request.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {request.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig.textColor}`} />
            <Badge className={statusConfig.color}>
              {request.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Requested by:</span>
            <span className="font-medium">{request.requested_by_user?.name || 'Unknown'}</span>
          </div>

          {request.assigned_to_user && (
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Assigned to:</span>
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs">
                    {request.assigned_to_user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{request.assigned_to_user.name}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{format(new Date(request.created_at), 'MMM dd, yyyy')}</span>
          </div>

          {request.due_date && (
            <div className="flex items-center gap-2">
              <Timer className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className="text-muted-foreground">Due:</span>
              <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                {format(new Date(request.due_date), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(request)}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            View Details
          </Button>
          
          {!request.assigned_to_user && onAssign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssign(request)}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Assign
            </Button>
          )}

          {request.status === 'submitted' && onStatusChange && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(request, 'approved')}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(request, 'rejected')}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
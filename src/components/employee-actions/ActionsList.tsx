import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Edit, 
  MessageSquare,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import type { EmployeeAction } from '@/types/employeeActions';
import { ACTION_TYPE_LABELS, ACTION_SEVERITY_LABELS, ACTION_STATUS_LABELS } from '@/types/employeeActions';
import { ActionDetailsDialog } from './ActionDetailsDialog';

interface ActionsListProps {
  actions: EmployeeAction[];
  canManage: boolean;
  showRecipient: boolean;
}

export const ActionsList: React.FC<ActionsListProps> = ({ 
  actions, 
  canManage, 
  showRecipient 
}) => {
  const [selectedAction, setSelectedAction] = useState<EmployeeAction | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      case 'appealed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'escalated': return <AlertTriangle className="h-3 w-3" />;
      case 'appealed': return <MessageSquare className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (actions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No actions found</p>
          <p className="text-sm">
            {canManage 
              ? 'Create your first employee action to get started.'
              : 'No actions have been issued to you yet.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {actions.map((action) => (
          <Card key={action.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className={getSeverityColor(action.severity)}>
                      {ACTION_SEVERITY_LABELS[action.severity]}
                    </Badge>
                    <Badge variant="outline">
                      {ACTION_TYPE_LABELS[action.action_type]}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(action.status)}>
                      {getStatusIcon(action.status)}
                      <span className="ml-1">{ACTION_STATUS_LABELS[action.status]}</span>
                    </Badge>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAction(action)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {action.description}
                </p>
                
                <Separator />
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {showRecipient && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{action.recipient_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(action.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    {action.team_name && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span>{action.team_name}</span>
                      </div>
                    )}
                  </div>
                  
                  {action.follow_up_date && (
                    <div className="text-xs">
                      Follow-up: {format(new Date(action.follow_up_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAction && (
        <ActionDetailsDialog
          action={selectedAction}
          open={!!selectedAction}
          onOpenChange={(open) => !open && setSelectedAction(null)}
          canManage={canManage}
        />
      )}
    </>
  );
};
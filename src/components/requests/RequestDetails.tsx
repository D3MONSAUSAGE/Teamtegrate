import { format } from 'date-fns';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Request, PRIORITY_COLORS, STATUS_COLORS, REQUEST_CATEGORIES } from '@/types/requests';
import RequestAcceptanceButton from './RequestAcceptanceButton';
import RequestCompletionDialog from './RequestCompletionDialog';
import RequestUpdatesSection from './RequestUpdatesSection';

interface RequestDetailsProps {
  request: Request;
  onRequestUpdated?: () => void;
}

export default function RequestDetails({ request, onRequestUpdated }: RequestDetailsProps) {

  const renderFormData = () => {
    if (!request.form_data || Object.keys(request.form_data).length === 0) {
      return <p className="text-muted-foreground">No additional details provided.</p>;
    }

    return (
      <div className="space-y-3">
        {Object.entries(request.form_data).map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 gap-4">
            <div className="font-medium capitalize">{key.replace(/_/g, ' ')}</div>
            <div className="col-span-2 text-muted-foreground">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{request.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={STATUS_COLORS[request.status]}>
                {request.status.replace('_', ' ')}
              </Badge>
              <Badge className={PRIORITY_COLORS[request.priority]}>
                {request.priority}
              </Badge>
              {request.request_type && (
                <Badge variant="outline">
                  {REQUEST_CATEGORIES[request.request_type.category as keyof typeof REQUEST_CATEGORIES]}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <RequestAcceptanceButton 
              request={request} 
              onRequestUpdated={onRequestUpdated || (() => {})} 
            />
            <RequestCompletionDialog 
              request={request} 
              onRequestUpdated={onRequestUpdated || (() => {})} 
            />
          </div>
        </div>

        {request.description && (
          <p className="text-muted-foreground">{request.description}</p>
        )}

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Requested by {request.requested_by_user?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
          </div>
          {request.due_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Due {format(new Date(request.due_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          {request.accepted_by && request.accepted_at && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Accepted by {request.accepted_by_user?.name || 'Someone'} on {format(new Date(request.accepted_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Request Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderFormData()}
        </CardContent>
      </Card>

      {/* Timeline/Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Request Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.created_at), 'MMM d, yyyy at h:mm a')}
                </p>
              </div>
            </div>
            
            {request.submitted_at && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Request Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(request.submitted_at), 'MMM d, yyyy at h:mm a')}
                  </p>
                </div>
              </div>
            )}
            
            {request.completed_at && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Request Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(request.completed_at), 'MMM d, yyyy at h:mm a')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Updates & Comments */}
      <RequestUpdatesSection request={request} />
    </div>
  );
}
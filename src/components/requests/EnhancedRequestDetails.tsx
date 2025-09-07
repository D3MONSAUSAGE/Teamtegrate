import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, User, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useEnhancedRequests } from '@/hooks/useEnhancedRequests';
import { useAuth } from '@/contexts/AuthContext';
import type { Request } from '@/types/requests';
import { PRIORITY_COLORS, STATUS_COLORS } from '@/types/requests';
import { cn } from '@/lib/utils';

interface EnhancedRequestDetailsProps {
  request: Request;
  onClose?: () => void;
}

export default function EnhancedRequestDetails({ request, onClose }: EnhancedRequestDetailsProps) {
  const { user } = useAuth();
  const { updateRequestStatus } = useEnhancedRequests();
  const [isProcessing, setIsProcessing] = useState(false);
  const [comments, setComments] = useState('');

  const canApprove = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);
  const isRequester = user?.id === request.requested_by;

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected' | 'completed') => {
    setIsProcessing(true);
    try {
      await updateRequestStatus(request.id, newStatus, comments);
      setComments('');
      onClose?.();
    } catch (error) {
      console.error('Error updating request status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const renderFormData = () => {
    if (!request.form_data || Object.keys(request.form_data).length === 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Request Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(request.form_data).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm font-medium capitalize">
                {key.replace(/_/g, ' ')}
              </Label>
              <div className="text-sm text-muted-foreground">
                {typeof value === 'string' ? (
                  key.includes('date') ? (
                    format(new Date(value), 'PPP')
                  ) : (
                    <div className="whitespace-pre-wrap">{value}</div>
                  )
                ) : (
                  JSON.stringify(value, null, 2)
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderApprovalActions = () => {
    if (!canApprove || request.status !== 'submitted') {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Request</CardTitle>
          <CardDescription>
            Approve, reject, or mark this request as completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approval-comments">Comments (Optional)</Label>
            <Textarea
              id="approval-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments about your decision..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate('approved')}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
            
            <Button
              onClick={() => handleStatusUpdate('rejected')}
              disabled={isProcessing}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>

            <Button
              onClick={() => handleStatusUpdate('completed')}
              disabled={isProcessing}
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Mark Complete'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Request Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{request.title}</CardTitle>
              <CardDescription>
                {request.request_type?.name} • {request.request_type?.category}
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Badge className={cn(getPriorityColor(request.priority))}>
                {request.priority}
              </Badge>
              <Badge className={cn(getStatusColor(request.status))}>
                {request.status}
              </Badge>
            </div>
          </div>
          
          {request.description && (
            <p className="text-muted-foreground">{request.description}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Requested by:</span>
              <span>{request.requested_by_user?.name || request.requested_by_user?.email || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{format(new Date(request.created_at), 'PPp')}</span>
            </div>
            
            {request.submitted_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted:</span>
                <span>{format(new Date(request.submitted_at), 'PPp')}</span>
              </div>
            )}
            
            {request.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span>{format(new Date(request.due_date), 'PPp')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Data */}
      {renderFormData()}

      {/* Approval Actions */}
      {renderApprovalActions()}

      {/* Status Information */}
      {request.status !== 'draft' && request.status !== 'submitted' && (
        <Card>
          <CardHeader>
            <CardTitle>Status Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {request.completed_at && (
                <div>
                  <span className="text-muted-foreground">Completed:</span>{' '}
                  {format(new Date(request.completed_at), 'PPp')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
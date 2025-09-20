import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, MessageCircle, FileText, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Request, PRIORITY_COLORS, STATUS_COLORS, REQUEST_CATEGORIES } from '@/types/requests';
import { useRequestComments } from '@/hooks/useRequestComments';
import RequestAcceptanceButton from './RequestAcceptanceButton';
import RequestCompletionDialog from './RequestCompletionDialog';
import RequestUpdatesSection from './RequestUpdatesSection';

interface RequestDetailsProps {
  request: Request;
  onRequestUpdated?: () => void;
}

export default function RequestDetails({ request, onRequestUpdated }: RequestDetailsProps) {
  const { comments, loading, addComment } = useRequestComments(request.id);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await addComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

      {/* Request Updates */}
      <RequestUpdatesSection requestId={request.id} requestStatus={request.status} />

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment */}
          <div className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmittingComment}
              size="sm"
              className="gap-2"
            >
              {isSubmittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Add Comment
            </Button>
          </div>

          <Separator />

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {comment.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{comment.user?.name || 'Unknown User'}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, yyyy at h:mm a')}
                      </span>
                      {comment.is_internal && (
                        <Badge variant="secondary" className="text-xs">Internal</Badge>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
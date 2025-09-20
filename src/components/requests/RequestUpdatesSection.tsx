import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Plus, Loader2, Send, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRequestUpdates } from '@/hooks/useRequestUpdates';
import { useAuth } from '@/contexts/AuthContext';
import { useRequestComments } from '@/hooks/useRequestComments';
import { Request } from '@/types/requests';

interface RequestUpdatesSectionProps {
  request: Request;
}

export default function RequestUpdatesSection({ request }: RequestUpdatesSectionProps) {
  const { updates, loading, addUpdate } = useRequestUpdates(request.id);
  const { comments, loading: commentsLoading, addComment } = useRequestComments(request.id);
  const { user } = useAuth();
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [updateType, setUpdateType] = useState<'progress' | 'comment'>('comment');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (updateType === 'comment') {
        await addComment(newUpdate);
      } else {
        await addUpdate('progress', 'Progress Update', newUpdate);
      }
      setNewUpdate('');
      setShowAddUpdate(false);
    } catch (error) {
      console.error('Error adding update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'assignment': return 'bg-blue-100 text-blue-800';
      case 'status_change': return 'bg-green-100 text-green-800';
      case 'progress': return 'bg-purple-100 text-purple-800';
      case 'comment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'assignment': return '👤';
      case 'status_change': return '🔄';
      case 'progress': return '📝';
      case 'comment': return '💬';
      default: return '📄';
    }
  };

  // Check if user can add updates - assigned users, requesters, or admins
  const isAssignedToCurrentUser = request.assigned_to && 
    (request.assigned_to === user?.id || 
     request.assigned_to.split(',').includes(user?.id || ''));
  
  const canAddUpdate = user && (
    // Assigned users can add updates when in progress
    (isAssignedToCurrentUser && ['under_review', 'in_progress'].includes(request.status)) ||
    // Requester can always comment
    request.requested_by === user.id ||
    // Admins can always add updates/comments
    ['admin', 'superadmin', 'manager'].includes(user.role || '')
  );

  // Combine and sort all activities
  const allActivities = [
    ...updates.map(update => ({ ...update, type: 'update' as const })),
    ...comments.map(comment => ({ ...comment, type: 'comment' as const, update_type: 'comment' }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (loading || commentsLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading updates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Updates & Comments ({allActivities.length})
          </CardTitle>
          {canAddUpdate && !showAddUpdate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddUpdate(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Update
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Update Form */}
        {showAddUpdate && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Select value={updateType} onValueChange={(value: 'progress' | 'comment') => setUpdateType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="progress">Progress Update</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder={updateType === 'comment' ? 'Add a comment...' : 'Describe the progress or changes made...'}
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowAddUpdate(false);
                  setNewUpdate('');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleAddUpdate}
                disabled={!newUpdate.trim() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {updateType === 'comment' ? 'Add Comment' : 'Add Update'}
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Activities List */}
        <div className="space-y-4">
          {allActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No updates or comments yet.</p>
          ) : (
            allActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {activity.user?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {activity.user?.name || 'System'}
                      </span>
                      <Badge variant="outline" className={getUpdateTypeColor(activity.update_type || 'comment')}>
                        <span className="mr-1">{getUpdateIcon(activity.update_type || 'comment')}</span>
                        {activity.type === 'comment' ? 'comment' : (activity.update_type || '').replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), 'MMM d, yyyy at h:mm a')}
                      </span>
                      {activity.type === 'comment' && 'is_internal' in activity && activity.is_internal && (
                        <Badge variant="secondary" className="text-xs">Internal</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {activity.type === 'update' && 'title' in activity && (
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {'content' in activity ? activity.content : ''}
                    </p>
                    {activity.type === 'update' && 'old_status' in activity && activity.old_status && 'new_status' in activity && activity.new_status && (
                      <p className="text-xs text-muted-foreground">
                        Status changed from <span className="font-medium">{activity.old_status}</span> to{' '}
                        <span className="font-medium">{activity.new_status}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
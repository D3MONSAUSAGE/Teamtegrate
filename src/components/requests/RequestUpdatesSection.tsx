import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Plus, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useRequestUpdates } from '@/hooks/useRequestUpdates';
import { useAuth } from '@/contexts/AuthContext';

interface RequestUpdatesSectionProps {
  requestId: string;
  requestStatus: string;
}

export default function RequestUpdatesSection({ requestId, requestStatus }: RequestUpdatesSectionProps) {
  const { updates, loading, addUpdate } = useRequestUpdates(requestId);
  const { user } = useAuth();
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addUpdate('progress', 'Progress Update', newUpdate);
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'assignment': return '👤';
      case 'status_change': return '🔄';
      case 'progress': return '📝';
      default: return '📄';
    }
  };

  const canAddUpdate = user?.role && ['admin', 'superadmin', 'manager'].includes(user.role) && 
                      requestStatus === 'in_progress';

  if (loading) {
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
            <Clock className="h-5 w-5" />
            Request Updates ({updates.length})
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
            <Textarea
              placeholder="Describe the progress or changes made..."
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              rows={3}
            />
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
                Add Update
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Updates List */}
        <div className="space-y-4">
          {updates.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No updates yet.</p>
          ) : (
            updates.map((update) => (
              <div key={update.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {update.user?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {update.user?.name || 'System'}
                      </span>
                      <Badge variant="outline" className={getUpdateTypeColor(update.update_type)}>
                        <span className="mr-1">{getUpdateIcon(update.update_type)}</span>
                        {update.update_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(update.created_at), 'MMM d, yyyy at h:mm a')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{update.title}</h4>
                    {update.content && (
                      <p className="text-sm text-muted-foreground">{update.content}</p>
                    )}
                    {update.old_status && update.new_status && (
                      <p className="text-xs text-muted-foreground">
                        Status changed from <span className="font-medium">{update.old_status}</span> to{' '}
                        <span className="font-medium">{update.new_status}</span>
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
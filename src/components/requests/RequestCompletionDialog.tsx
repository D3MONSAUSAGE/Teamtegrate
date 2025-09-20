import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Request } from '@/types/requests';

interface RequestCompletionDialogProps {
  request: Request;
  onRequestUpdated: () => void;
}

export default function RequestCompletionDialog({ request, onRequestUpdated }: RequestCompletionDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const canCompleteRequest = (request.accepted_by === user?.id || request.assigned_to === user?.id) && 
    request.status === 'in_progress';

  const handleCompleteRequest = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to complete requests');
      return;
    }

    setIsCompleting(true);
    try {
      // Update the request status and add completion notes
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: completionNotes.trim() || null
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Add a completion update
      const { error: updateLogError } = await supabase
        .from('request_updates')
        .insert({
          organization_id: request.organization_id,
          request_id: request.id,
          user_id: user.id,
          update_type: 'status_change',
          title: 'Request Completed',
          content: completionNotes.trim() || 'Request has been completed successfully.',
          old_status: 'in_progress',
          new_status: 'completed'
        });

      if (updateLogError) throw updateLogError;

      toast.success('Request completed successfully!');
      setIsOpen(false);
      setCompletionNotes('');
      onRequestUpdated();
    } catch (error) {
      console.error('Error completing request:', error);
      toast.error('Failed to complete request');
    } finally {
      setIsCompleting(false);
    }
  };

  if (!canCompleteRequest) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Mark as Completed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Request</DialogTitle>
          <DialogDescription>
            Mark this request as completed. You can optionally add completion notes to describe what was accomplished.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="completion-notes">Completion Notes (Optional)</Label>
            <Textarea
              id="completion-notes"
              placeholder="Describe what was completed, any relevant details, or next steps..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isCompleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCompleteRequest}
            disabled={isCompleting}
          >
            {isCompleting ? 'Completing...' : 'Complete Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
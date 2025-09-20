import React, { useState } from 'react';
import { Check, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Request } from '@/types/requests';

interface RequestAcceptanceButtonProps {
  request: Request;
  onRequestUpdated: () => void;
}

export default function RequestAcceptanceButton({ request, onRequestUpdated }: RequestAcceptanceButtonProps) {
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  const isAssignedToCurrentUser = request.assigned_to && 
    (request.assigned_to === user?.id || 
     request.assigned_to.split(',').includes(user?.id || ''));

  const canAcceptRequest = isAssignedToCurrentUser && 
    request.status === 'under_review' && 
    !request.accepted_by;

  const isAlreadyAccepted = request.accepted_by && request.status === 'in_progress';
  const isAcceptedByCurrentUser = request.accepted_by === user?.id;
  const isAcceptedByOther = request.accepted_by && request.accepted_by !== user?.id;

  const handleAcceptRequest = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to accept requests');
      return;
    }

    setIsAccepting(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          accepted_by: user.id,
          // The trigger will handle setting accepted_at and status to 'in_progress'
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Request accepted successfully! You can now work on this request.');
      onRequestUpdated();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setIsAccepting(false);
    }
  };

  if (!isAssignedToCurrentUser) {
    return null;
  }

  if (isAlreadyAccepted) {
    if (isAcceptedByCurrentUser) {
      return (
        <Badge variant="default" className="gap-2">
          <Check className="h-4 w-4" />
          Accepted by you
        </Badge>
      );
    } else if (isAcceptedByOther) {
      return (
        <Badge variant="secondary" className="gap-2">
          <User className="h-4 w-4" />
          Accepted by {request.accepted_by_user?.name || 'another user'}
        </Badge>
      );
    }
  }

  if (canAcceptRequest) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="default" className="gap-2">
            <Clock className="h-4 w-4" />
            Accept Request
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Request</AlertDialogTitle>
            <AlertDialogDescription>
              By accepting this request, you will become the primary assignee and the request status will change to "In Progress". 
              Other assigned users will be removed from this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAcceptRequest}
              disabled={isAccepting}
            >
              {isAccepting ? 'Accepting...' : 'Accept Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}
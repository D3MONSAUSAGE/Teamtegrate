import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';

interface RemoveFromTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  teamId: string | null;
  teamName: string;
  onSuccess: () => void;
}

const RemoveFromTeamDialog: React.FC<RemoveFromTeamDialogProps> = ({
  open,
  onOpenChange,
  userId,
  userName,
  teamId,
  teamName,
  onSuccess
}) => {
  const { removeTeamMember } = useTeamMemberOperations();

  const handleRemove = async () => {
    if (!teamId) return;

    try {
      await removeTeamMember(teamId, userId);
      onSuccess();
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove from Team
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{userName}</strong> from <strong>{teamName}</strong>?
          </AlertDialogDescription>
          <div className="mt-3 text-sm text-muted-foreground">
            <p className="mb-2">This will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Remove their access to team-specific resources</li>
              <li>Unassign them from team tasks</li>
              <li>Remove them from team communications</li>
            </ul>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">
            Remove from Team
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RemoveFromTeamDialog;

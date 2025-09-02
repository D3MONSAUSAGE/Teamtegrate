import React from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Loader2 } from 'lucide-react';
import { Team } from '@/types/teams';

interface DeleteTeamDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const DeleteTeamDialog: React.FC<DeleteTeamDialogProps> = ({
  team,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}) => {
  if (!team) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Team
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete <strong>"{team.name}"</strong>? 
                This action cannot be undone.
              </p>
              
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team Members:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.member_count}
                  </Badge>
                </div>
                
                {team.manager_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Manager:</span>
                    <span className="font-medium">{team.manager_name}</span>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>What happens when you delete this team:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Team will be marked as inactive</li>
                  <li>All team members will be removed</li>
                  <li>Team data will be preserved for audit purposes</li>
                  <li>Associated projects may need reassignment</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Team'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTeamDialog;
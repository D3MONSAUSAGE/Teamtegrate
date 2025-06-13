
import React, { useState, useEffect } from 'react';
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
import { Loader2, AlertTriangle } from 'lucide-react';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onUserDeleted: () => void;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserDeleted
}) => {
  const { deleteUser, getUserImpactAnalysis } = useEnhancedUserManagement();
  const [isDeleting, setIsDeleting] = useState(false);
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      setLoading(true);
      getUserImpactAnalysis(user.id)
        .then(setImpact)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, user?.id, getUserImpactAnalysis]);

  const handleDelete = async () => {
    if (!user?.id) return;

    setIsDeleting(true);
    try {
      const success = await deleteUser(user.id);
      if (success) {
        onUserDeleted();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete User Account
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to permanently delete <strong>{user.name}</strong> ({user.email})?
              </p>
              
              {loading ? (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing impact...
                </div>
              ) : impact ? (
                <div className="space-y-2">
                  {!impact.can_be_deleted && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800 font-medium">
                        ⛔ {impact.deletion_blocked_reason}
                      </p>
                    </div>
                  )}
                  
                  {impact.can_be_deleted && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">This action will affect:</p>
                      <div className="space-y-1 text-sm">
                        {impact.tasks_assigned > 0 && (
                          <div className="flex justify-between">
                            <span>Assigned tasks:</span>
                            <Badge variant="outline">{impact.tasks_assigned}</Badge>
                          </div>
                        )}
                        {impact.project_tasks_assigned > 0 && (
                          <div className="flex justify-between">
                            <span>Project tasks:</span>
                            <Badge variant="outline">{impact.project_tasks_assigned}</Badge>
                          </div>
                        )}
                        {impact.projects_managed > 0 && (
                          <div className="flex justify-between">
                            <span>Managed projects:</span>
                            <Badge variant="outline">{impact.projects_managed}</Badge>
                          </div>
                        )}
                        {impact.chat_rooms_created > 0 && (
                          <div className="flex justify-between">
                            <span>Created chat rooms:</span>
                            <Badge variant="outline">{impact.chat_rooms_created}</Badge>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        All associated data will be unassigned or transferred appropriately.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || loading || !impact?.can_be_deleted}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;

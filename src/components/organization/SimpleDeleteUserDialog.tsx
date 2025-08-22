
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
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
import { Loader2, AlertTriangle } from 'lucide-react';

interface SimpleDeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onUserDeleted: () => void;
  deleteUser: (userId: string, deletionReason?: string) => Promise<any>;
}

const SimpleDeleteUserDialog: React.FC<SimpleDeleteUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserDeleted,
  deleteUser
}) => {
  const { user: currentUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!currentUser?.id || !user?.id) {
      toast.error('Missing required information');
      return;
    }

    // Prevent self-deletion
    if (currentUser.id === user.id) {
      toast.error('You cannot delete your own account');
      return;
    }

    // Verify superadmin role
    if (currentUser.role !== 'superadmin') {
      toast.error('Only superadmins can delete users');
      return;
    }

    // Check if this would leave organization without superadmin
    if (user.role === 'superadmin') {
      try {
        const { data: validationResult, error: validationError } = await supabase.rpc(
          'would_leave_org_without_superadmin', 
          { 
            target_user_id: user.id, 
            target_org_id: currentUser.organizationId 
          }
        );

        if (validationError) {
          console.error('Validation error:', validationError);
          toast.error('Unable to validate deletion. Please try again.');
          return;
        }

        if (validationResult) {
          toast.error('Cannot delete the only superadmin. Promote another user to superadmin first.');
          return;
        }
      } catch (error) {
        console.error('Error during validation:', error);
        toast.error('Unable to validate deletion. Please try again.');
        return;
      }
    }

    setIsDeleting(true);
    try {
      console.log('Starting user deletion process for:', user.email);
      
      // Use the deleteUser function passed from the hook
      const result = await deleteUser(user.id, 'User deleted by admin');

      console.log('User deletion completed successfully');
      toast.success(`User ${user.name} has been deleted successfully`);
      onUserDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      let errorMessage = error.message || 'Failed to delete user';
      
      if (errorMessage.includes('timeout')) {
        errorMessage = 'User deletion timed out. Please try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network connection issue. Please check your connection and try again.';
      } else if (errorMessage.includes('Edge Function')) {
        errorMessage = 'User deletion service error. Please try again.';
      }
      
      toast.error(errorMessage);
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
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-950/20 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ This action cannot be undone
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                  This will remove the user and unassign them from all tasks and projects.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
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

export default SimpleDeleteUserDialog;

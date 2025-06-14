
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
}

const SimpleDeleteUserDialog: React.FC<SimpleDeleteUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserDeleted
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
      toast.error('Cannot delete the only superadmin. Promote another user to superadmin first.');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Starting user deletion process for:', user.email);
      
      // Clean up related data first
      await cleanupUserData(user.id);
      
      // Delete from users table (this will also handle auth cleanup via RLS/triggers)
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw new Error(`Failed to delete user: ${dbError.message}`);
      }

      // Also delete from auth if still exists
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        if (authError && !authError.message.includes('not found')) {
          console.error('Auth deletion error:', authError);
          // Don't throw here - user is already deleted from users table
        }
      } catch (authError) {
        console.error('Auth deletion error:', authError);
        // Don't throw - user is already deleted from main table
      }

      console.log('User deletion completed successfully');
      toast.success(`User ${user.name} has been deleted successfully`);
      onUserDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const cleanupUserData = async (userId: string) => {
    console.log('Cleaning up user data for:', userId);
    
    try {
      // Clean up tasks - unassign user
      await supabase
        .from('tasks')
        .update({ 
          assigned_to_id: null,
          assigned_to_ids: [],
          assigned_to_names: []
        })
        .eq('assigned_to_id', userId);

      // Clean up project tasks - unassign user
      await supabase
        .from('project_tasks')
        .update({ 
          assigned_to_id: null,
          assigned_to_ids: [],
          assigned_to_names: []
        })
        .eq('assigned_to_id', userId);

      // Remove from project team members
      await supabase
        .from('project_team_members')
        .delete()
        .eq('user_id', userId);

      // Remove from chat participants
      await supabase
        .from('chat_participants')
        .delete()
        .eq('user_id', userId);

      // Delete user's chat messages
      await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      // Delete user's time entries
      await supabase
        .from('time_entries')
        .delete()
        .eq('user_id', userId);

      // Delete user's notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      // Delete user's documents
      await supabase
        .from('documents')
        .delete()
        .eq('user_id', userId);

      console.log('User data cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Don't throw - we still want to try to delete the user
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

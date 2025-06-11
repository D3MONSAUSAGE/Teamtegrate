import React, { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Shield, Users, MessageSquare, Building2, ClipboardList } from 'lucide-react';
import { User } from '@/types';
import { useUserDeletionCheck } from '@/hooks/useUserDeletionCheck';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface EnhancedUserDeleteDialogProps {
  user: User; // Changed from AppUser to User
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeleted: () => void;
}

const EnhancedUserDeleteDialog: React.FC<EnhancedUserDeleteDialogProps> = ({ 
  user,
  open,
  onOpenChange,
  onUserDeleted
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  
  const { impact, isLoading, error, canDelete, warnings } = useUserDeletionCheck(user);

  const confirmationText = `DELETE ${user?.name || ''}`;
  const isConfirmValid = confirmText === confirmationText;
  const canProceed = isConfirmValid && canDelete && !isLoading;

  const handleConfirm = () => {
    if (canProceed) {
      onUserDeleted();
    }
  };

  const getImpactIcon = (type: string) => {
    switch (type) {
      case 'tasks': return <ClipboardList className="h-4 w-4" />;
      case 'projects': return <Building2 className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'teams': return <Users className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete User Account
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete the account for{' '}
            <span className="font-semibold">{user?.name}</span> ({user?.email}).
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Analyzing deletion impact...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {impact && !canDelete && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Deletion Blocked</h3>
              </div>
              <p className="text-sm text-destructive mb-2">
                This user cannot be deleted because they are the only admin in one or more organizations.
              </p>
              <p className="text-sm text-muted-foreground">
                Please assign another admin before proceeding with deletion.
              </p>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Impact Analysis
              </h4>
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {impact && canDelete && (
            <div className="space-y-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} detailed impact analysis
              </button>
              
              {showDetails && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getImpactIcon('tasks')}
                    <span className="text-sm">Tasks assigned: {impact.tasks_assigned}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getImpactIcon('projects')}
                    <span className="text-sm">Projects managed: {impact.projects_managed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getImpactIcon('chat')}
                    <span className="text-sm">Chat rooms created: {impact.chat_rooms_created}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getImpactIcon('teams')}
                    <span className="text-sm">Team memberships: {impact.team_memberships}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Deletion Details</h4>
            
            <div className="space-y-2">
              <Label htmlFor="deletion-reason">Reason for deletion (optional)</Label>
              <Textarea
                id="deletion-reason"
                placeholder="Enter the reason for deleting this user account..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-text" className="text-destructive">
                Type "{confirmationText}" to confirm deletion
              </Label>
              <Input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmationText}
                className="font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <h5 className="font-medium mb-2">This action will:</h5>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Permanently delete the user account</li>
              <li>• Remove user from all teams and projects</li>
              <li>• Unassign user from all tasks</li>
              <li>• Delete personal data (messages, comments, documents)</li>
              <li>• Create an audit log entry</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canProceed || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

export default EnhancedUserDeleteDialog;

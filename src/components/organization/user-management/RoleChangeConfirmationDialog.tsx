
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
import { AlertTriangle } from 'lucide-react';
import { UserRole } from '@/types';

interface RoleChangeConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isChangingRole: boolean;
  userName: string;
  currentRole: UserRole;
  newRole: UserRole | null;
  requiresTransfer: boolean;
  currentSuperadminName: string;
}

const RoleChangeConfirmationDialog: React.FC<RoleChangeConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isChangingRole,
  userName,
  currentRole,
  newRole,
  requiresTransfer,
  currentSuperadminName
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {requiresTransfer && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            Confirm Role Change
          </AlertDialogTitle>
          <AlertDialogDescription>
            {requiresTransfer ? (
              <div className="space-y-2">
                <p>
                  You are about to promote <strong>{userName}</strong> to <strong>superadmin</strong>.
                </p>
                <p className="text-yellow-600 font-medium">
                  This will automatically demote <strong>{currentSuperadminName}</strong> to <strong>admin</strong> 
                  since each organization can only have one superadmin.
                </p>
                <p>Are you sure you want to proceed?</p>
              </div>
            ) : (
              <>
                Are you sure you want to change <strong>{userName}</strong>'s role 
                from <strong>{currentRole}</strong> to <strong>{newRole}</strong>?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isChangingRole}>
            {isChangingRole ? 'Updating...' : 'Confirm Change'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RoleChangeConfirmationDialog;

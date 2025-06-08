
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
import { Loader2 } from 'lucide-react';
import { UserRole, getRoleDisplayName } from '@/types';

interface RoleChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isChanging: boolean;
  targetUserName: string;
  currentRole: UserRole;
  newRole: UserRole | null;
}

const RoleChangeDialog: React.FC<RoleChangeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isChanging,
  targetUserName,
  currentRole,
  newRole
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change User Role</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change {targetUserName}'s role from{' '}
            <Badge variant="outline" className="mx-1">
              {getRoleDisplayName(currentRole)}
            </Badge>
            to{' '}
            <Badge variant="outline" className="mx-1">
              {newRole ? getRoleDisplayName(newRole) : ''}
            </Badge>
            ?
            <br /><br />
            This will change their access permissions throughout the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isChanging}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isChanging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              'Update Role'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RoleChangeDialog;

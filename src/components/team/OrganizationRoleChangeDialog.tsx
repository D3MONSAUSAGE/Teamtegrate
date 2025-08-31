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
import { UserRole, getRoleDisplayName } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';

interface OrganizationRoleChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isChanging: boolean;
  targetUserName: string;
  currentRole: UserRole;
  newRole: UserRole;
}

const OrganizationRoleChangeDialog: React.FC<OrganizationRoleChangeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isChanging,
  targetUserName,
  currentRole,
  newRole
}) => {
  const isUpgrade = () => {
    const roleHierarchy = { 'user': 1, 'manager': 2, 'admin': 3, 'superadmin': 4 };
    return roleHierarchy[newRole] > roleHierarchy[currentRole];
  };

  const getChangeDescription = () => {
    if (isUpgrade()) {
      return `This will give ${targetUserName} additional permissions and access within your organization.`;
    } else {
      return `This will reduce ${targetUserName}'s permissions and access within your organization.`;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Change Organization Role
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to change <strong>{targetUserName}</strong>'s organization role.
            </p>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Current Role</div>
                <Badge variant="outline">{getRoleDisplayName(currentRole)}</Badge>
              </div>
              <div className="text-lg">→</div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">New Role</div>
                <Badge variant={isUpgrade() ? "default" : "secondary"}>
                  {getRoleDisplayName(newRole)}
                </Badge>
              </div>
            </div>

            <p className="text-sm">{getChangeDescription()}</p>
            
            {newRole === 'admin' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Admin Role:</strong> This user will be able to manage other users, 
                  create teams, and access organization settings.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isChanging}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isChanging}
            className={isUpgrade() ? 'bg-primary' : 'bg-amber-600 hover:bg-amber-700'}
          >
            {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpgrade() ? 'Upgrade Role' : 'Change Role'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OrganizationRoleChangeDialog;
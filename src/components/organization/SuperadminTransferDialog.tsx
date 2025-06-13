
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
import { Loader2, Crown, AlertTriangle } from 'lucide-react';

interface SuperadminTransferData {
  targetUserId: string;
  targetUserName: string;
  currentSuperadminId: string;
  currentSuperadminName: string;
}

interface SuperadminTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferData: SuperadminTransferData | null;
  onConfirm: (transferData: SuperadminTransferData) => Promise<void>;
  isTransferring: boolean;
}

const SuperadminTransferDialog: React.FC<SuperadminTransferDialogProps> = ({
  open,
  onOpenChange,
  transferData,
  onConfirm,
  isTransferring
}) => {
  if (!transferData) return null;

  const handleConfirm = async () => {
    await onConfirm(transferData);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Transfer Superadmin Role
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  Only one superadmin is allowed per organization
                </span>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm">
                  Promoting <strong>{transferData.targetUserName}</strong> to superadmin will automatically demote the current superadmin.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                    <span className="text-sm">Current Superadmin:</span>
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      {transferData.currentSuperadminName}
                    </Badge>
                  </div>
                  <div className="flex justify-center">
                    <span className="text-xs text-muted-foreground">↓ Will become Admin</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                    <span className="text-sm">New Superadmin:</span>
                    <Badge variant="default" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      {transferData.targetUserName}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone automatically. You would need to manually transfer the role back if needed.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={isTransferring}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isTransferring}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isTransferring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Transferring...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Transfer Role
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SuperadminTransferDialog;

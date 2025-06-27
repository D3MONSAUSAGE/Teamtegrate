
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Sparkles } from 'lucide-react';
import EnhancedInviteCodeGenerator from '@/components/auth/EnhancedInviteCodeGenerator';

interface InviteCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteCodeDialog: React.FC<InviteCodeDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Invite Users to Organization
            </span>
            <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <EnhancedInviteCodeGenerator />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCodeDialog;

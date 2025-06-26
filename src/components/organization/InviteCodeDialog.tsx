
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Sparkles } from 'lucide-react';
import EnhancedInviteCodeGenerator from '@/components/auth/EnhancedInviteCodeGenerator';

interface InviteCodeDialogProps {
  children?: React.ReactNode;
}

const InviteCodeDialog: React.FC<InviteCodeDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full justify-start bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <UserPlus className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-medium">Invite User</span>
            <Sparkles className="h-3 w-3 ml-2 animate-pulse" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Invite Users to Organization
            </span>
            <Sparkles className="h-5 w-5 text-accent animate-pulse" />
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

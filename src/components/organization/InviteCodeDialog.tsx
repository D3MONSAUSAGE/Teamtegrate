
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';
import InviteCodeGenerator from '@/components/auth/InviteCodeGenerator';

interface InviteCodeDialogProps {
  children?: React.ReactNode;
}

const InviteCodeDialog: React.FC<InviteCodeDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full justify-start" variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Users to Organization</DialogTitle>
        </DialogHeader>
        <InviteCodeGenerator />
      </DialogContent>
    </Dialog>
  );
};

export default InviteCodeDialog;

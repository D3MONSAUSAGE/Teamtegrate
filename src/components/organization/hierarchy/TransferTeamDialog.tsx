import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import { Team } from '@/types/teams';

interface TransferTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  fromTeamId: string | null;
  teams: Team[];
  onSuccess: () => void;
}

const TransferTeamDialog: React.FC<TransferTeamDialogProps> = ({
  open,
  onOpenChange,
  userId,
  userName,
  fromTeamId,
  teams,
  onSuccess
}) => {
  const { transferTeamMember } = useTeamMemberOperations();
  const [toTeamId, setToTeamId] = useState('');
  const [newRole, setNewRole] = useState<'manager' | 'member' | 'admin'>('member');
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!fromTeamId || !toTeamId) return;

    setIsTransferring(true);
    try {
      await transferTeamMember(fromTeamId, toTeamId, userId, newRole);
      onSuccess();
      setToTeamId('');
      setNewRole('member');
    } catch (error) {
      console.error('Error transferring team member:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Team Member
          </DialogTitle>
          <DialogDescription>
            Transfer <strong>{userName}</strong> to a different team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target-team">Target Team</Label>
            <Select value={toTeamId} onValueChange={setToTeamId}>
              <SelectTrigger id="target-team">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role in New Team</Label>
            <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="text-muted-foreground">
              <strong>Note:</strong> This will move the user from their current team and reassign their tasks to the new team.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTransferring}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={!toTeamId || isTransferring}>
            {isTransferring ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferTeamDialog;

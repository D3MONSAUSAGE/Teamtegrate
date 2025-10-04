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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import { useJobRoles } from '@/hooks/useJobRoles';
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
  const { jobRoles } = useJobRoles();
  const [toTeamId, setToTeamId] = useState('');
  const [newRole, setNewRole] = useState<'manager' | 'member' | 'admin'>('member');
  const [selectedJobRoles, setSelectedJobRoles] = useState<string[]>([]);
  const [primaryJobRole, setPrimaryJobRole] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  const handleJobRoleToggle = (jobRoleId: string) => {
    setSelectedJobRoles(prev => {
      if (prev.includes(jobRoleId)) {
        const updated = prev.filter(id => id !== jobRoleId);
        if (primaryJobRole === jobRoleId) {
          setPrimaryJobRole(updated[0] || '');
        }
        return updated;
      } else {
        const updated = [...prev, jobRoleId];
        if (!primaryJobRole) {
          setPrimaryJobRole(jobRoleId);
        }
        return updated;
      }
    });
  };

  const handleTransfer = async () => {
    if (!fromTeamId || !toTeamId) return;

    setIsTransferring(true);
    try {
      const jobRoleAssignments = selectedJobRoles.map(roleId => ({
        jobRoleId: roleId,
        isPrimary: roleId === primaryJobRole
      }));
      
      await transferTeamMember(fromTeamId, toTeamId, userId, newRole, jobRoleAssignments);
      onSuccess();
      setToTeamId('');
      setNewRole('member');
      setSelectedJobRoles([]);
      setPrimaryJobRole('');
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

          <div className="space-y-2">
            <Label>Job Roles (Optional)</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              {jobRoles && jobRoles.length > 0 ? (
                jobRoles.map(role => (
                  <div key={role.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`job-role-${role.id}`}
                      checked={selectedJobRoles.includes(role.id)}
                      onCheckedChange={() => handleJobRoleToggle(role.id)}
                    />
                    <Label 
                      htmlFor={`job-role-${role.id}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {role.name}
                    </Label>
                    {selectedJobRoles.includes(role.id) && (
                      <RadioGroup value={primaryJobRole} onValueChange={setPrimaryJobRole}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={role.id} id={`primary-${role.id}`} />
                          <Label htmlFor={`primary-${role.id}`} className="text-xs cursor-pointer">
                            Primary
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No job roles available</p>
              )}
            </div>
            {selectedJobRoles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected {selectedJobRoles.length} role(s)
                {primaryJobRole && ` • Primary: ${jobRoles?.find(r => r.id === primaryJobRole)?.name}`}
              </p>
            )}
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

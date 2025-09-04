import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, User, AlertCircle } from 'lucide-react';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useReassignTraining } from '@/hooks/useTrainingReassignment';
import { useReassignCompliance } from '@/hooks/useComplianceRetraining';

interface ReassignTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  isComplianceMode?: boolean;
}

const ReassignTrainingDialog: React.FC<ReassignTrainingDialogProps> = ({
  open,
  onOpenChange,
  assignment,
  isComplianceMode = false
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const { users = [] } = useOrganizationUsers();
  const reassignMutation = useReassignTraining();
  const reassignComplianceMutation = useReassignCompliance();

  const handleReassign = async () => {
    if (!selectedUserId || !reason.trim() || !assignment) return;

    try {
      if (isComplianceMode) {
        await reassignComplianceMutation.mutateAsync({
          recordId: assignment.id,
          newUserId: selectedUserId,
          reason: reason
        });
      } else {
        await reassignMutation.mutateAsync({
          assignmentId: assignment.id,
          newAssigneeId: selectedUserId,
          reason: reason
        });
      }
      
      // Reset form and close dialog
      setSelectedUserId('');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error reassigning:', error);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            {isComplianceMode ? 'Reassign Compliance Training' : 'Reassign Training'}
          </DialogTitle>
          <DialogDescription>
            {isComplianceMode 
              ? `Reassign compliance training from ${assignment?.user?.name} to a different user.`
              : `Reassign "${assignment?.content_title}" from ${assignment?.assigned_to_user?.name} to a different user.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Select New User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.filter(user => 
                  user.id !== (isComplianceMode ? assignment?.user_id : assignment?.assigned_to)
                ).map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email} • {user.role}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Reassignment</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for reassignment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleReassign}
            disabled={!selectedUserId || !reason.trim() || (isComplianceMode ? reassignComplianceMutation.isPending : reassignMutation.isPending)}
          >
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignTrainingDialog;
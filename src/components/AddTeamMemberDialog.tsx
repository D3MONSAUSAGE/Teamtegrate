
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TeamMemberForm from "./team/TeamMemberForm";

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamMemberAdded: () => void;
}

const AddTeamMemberDialog = ({ open, onOpenChange, onTeamMemberAdded }: AddTeamMemberDialogProps) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSuccess = () => {
    onTeamMemberAdded();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        
        <TeamMemberForm 
          onCancel={handleClose}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberDialog;

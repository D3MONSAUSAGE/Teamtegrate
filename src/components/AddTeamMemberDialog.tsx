
import React from 'react';
import EnhancedAddTeamMemberDialog from './team/EnhancedAddTeamMemberDialog';

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamMemberAdded: () => void;
  teamId?: string;
}

const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = (props) => {
  return <EnhancedAddTeamMemberDialog {...props} />;
};

export default AddTeamMemberDialog;

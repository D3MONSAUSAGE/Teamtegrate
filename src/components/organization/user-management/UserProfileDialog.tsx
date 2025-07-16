
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedEmployeeProfileDialog from '../admin/EnhancedEmployeeProfileDialog';
import BasicUserProfileDialog from './BasicUserProfileDialog';

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = (props) => {
  const { user: currentUser } = useAuth();
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  
  // Show enhanced dialog for admins, basic dialog for others
  if (isAdmin) {
    return <EnhancedEmployeeProfileDialog {...props} />;
  }
  
  return <BasicUserProfileDialog {...props} />;
};

export default UserProfileDialog;


import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkUserExists, isAlreadyTeamMember } from '@/contexts/task/api/team';

interface TeamMemberFormData {
  email: string;
  role: string;
  verified: boolean;
}

interface UseTeamMemberFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const useTeamMemberForm = ({ onSuccess, onCancel }: UseTeamMemberFormProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TeamMemberFormData>({
    email: '',
    role: 'Developer',
    verified: false
  });

  const handleInputChange = (field: keyof TeamMemberFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user makes changes
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) {
      setError('You must be logged in to add team members');
      return;
    }

    if (!user.organizationId) {
      setError('No organization found. Please contact your administrator.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if email exists in the users table
      const userExists = await checkUserExists(formData.email.trim().toLowerCase());
      
      if (!userExists) {
        setError('This email is not registered in the system. The user needs to sign up first.');
        setIsLoading(false);
        return;
      }

      // Check if the user is already a team member under this manager
      const alreadyTeamMember = await isAlreadyTeamMember(formData.email.trim().toLowerCase(), user.id);
      
      if (alreadyTeamMember) {
        setError('This user is already a member of your team');
        setIsLoading(false);
        return;
      }

      // Get user details from the users table
      const { data: existingUser, error: userDataError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('email', formData.email.trim().toLowerCase())
        .single();

      if (userDataError || !existingUser) {
        console.error('Error fetching user details:', userDataError);
        setError('Error retrieving user information. Please try again.');
        setIsLoading(false);
        return;
      }

      // Add user as team member with organization_id
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          name: existingUser.name,
          manager_id: user.id,
          organization_id: user.organizationId
        });

      if (insertError) {
        console.error('Error adding team member:', insertError);
        setError('Failed to add team member. Please try again.');
        setIsLoading(false);
        return;
      }

      toast.success('Team member added successfully');
      onSuccess();
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
  };
};

export default useTeamMemberForm;

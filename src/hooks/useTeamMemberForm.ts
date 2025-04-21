
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkUserExists } from '@/contexts/task/api/team';

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

    setIsLoading(true);
    setError(null);

    try {
      // Check if email exists in the users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          setError('This email is not registered in the system. The user needs to sign up first.');
        } else {
          console.error('Error checking for existing user:', checkError);
          setError('Error checking email. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      if (!existingUser) {
        setError('This email is not registered in the system. The user needs to sign up first.');
        setIsLoading(false);
        return;
      }

      // Check if the user is already a team member under this manager
      const { data: existingTeamMember, error: teamMemberCheckError } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase())
        .eq('manager_id', user.id)
        .single();

      if (existingTeamMember) {
        setError('This user is already a member of your team');
        setIsLoading(false);
        return;
      }

      // Add user as team member
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          name: existingUser.name,
          manager_id: user.id
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

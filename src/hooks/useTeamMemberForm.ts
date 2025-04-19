
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [formData, setFormData] = useState<TeamMemberFormData>({
    email: '',
    role: 'Developer',
    verified: false
  });

  const handleInputChange = (field: keyof TeamMemberFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to add team members');
      return;
    }

    setIsLoading(true);

    try {
      // Check if email exists in the users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (checkError) {
        console.error('Error checking for existing user:', checkError);
        toast.error('Error checking email');
        setIsLoading(false);
        return;
      }

      if (!existingUser) {
        toast.error('This email is not registered in the system. The user needs to sign up first.');
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
        if (insertError.code === '23505') { // Unique violation
          toast.error('This user is already a member of your team');
        } else {
          console.error('Error adding team member:', insertError);
          toast.error('Failed to add team member');
        }
        setIsLoading(false);
        return;
      }

      toast.success('Team member added successfully');
      onSuccess();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleInputChange,
    handleSubmit,
  };
};

export default useTeamMemberForm;

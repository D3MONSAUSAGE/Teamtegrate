
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TeamMemberFormData {
  name: string;
  email: string;
  role: string;
  password: string;
}

interface UseTeamMemberFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const useTeamMemberForm = ({ onSuccess, onCancel }: UseTeamMemberFormProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: '',
    email: '',
    role: 'Developer',
    password: '',
  });

  const handleInputChange = (field: keyof TeamMemberFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Developer',
      password: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.name.trim() || !formData.email.trim() || !formData.role || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to add team members');
      return;
    }

    setIsLoading(true);

    try {
      // Check if email already exists by querying the database
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing team member:', checkError);
        toast.error('An error occurred while checking email');
        setIsLoading(false);
        return;
      }

      if (existingMember) {
        toast.error('A team member with this email already exists');
        setIsLoading(false);
        return;
      }

      // First create user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: formData.email.toLowerCase(),
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name,
          role: formData.role
        }
      });

      if (signUpError) {
        console.error('Error creating user account:', signUpError);
        toast.error('Failed to create user account: ' + signUpError.message);
        setIsLoading(false);
        return;
      }

      // Insert new team member into Supabase
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          manager_id: user.id
        });

      if (insertError) {
        console.error('Error adding team member:', insertError);
        toast.error('Failed to add team member');
        setIsLoading(false);
        return;
      }

      // Success
      resetForm();
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
    resetForm,
  };
};

export default useTeamMemberForm;

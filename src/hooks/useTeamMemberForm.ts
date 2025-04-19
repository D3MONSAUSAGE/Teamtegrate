
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkUserExists } from '@/contexts/task/api/team';

interface TeamMemberFormData {
  name: string;
  email: string;
  role: string;
  password: string;
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
    name: '',
    email: '',
    role: 'Developer',
    password: '',
    verified: false
  });

  const handleInputChange = (field: keyof TeamMemberFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Developer',
      password: '',
      verified: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.password && !formData.verified) {
      toast.error('Please provide a password for the new team member');
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
      
      // Check if user already exists in auth system
      const userExists = await checkUserExists(formData.email);
      
      if (!userExists) {
        // Create new user account if it doesn't exist
        const { error: signupError, data } = await supabase.auth.signUp({
          email: formData.email.trim().toLowerCase(),
          password: formData.password || Math.random().toString(36).slice(-10), // Use provided password or generate a random one
          options: {
            data: {
              name: formData.name.trim(),
              role: formData.role
            },
            emailRedirectTo: `${window.location.origin}/login`,
          }
        });
        
        if (signupError) {
          console.error('Error creating user account:', signupError);
          toast.error('Failed to create user account');
          setIsLoading(false);
          return;
        }
        
        // If the verified flag is set, we need to manually verify the email
        if (formData.verified) {
          // Note: Users can't directly verify other users via client-side code
          // This would require a server-side function with admin privileges
          // But we can add this flag to indicate it should be considered verified
          console.log('Team member marked as verified, this requires admin action');
        }
      }

      // Insert new team member into Supabase
      const { error: insertError, data: newMember } = await supabase
        .from('team_members')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          manager_id: user.id
        })
        .select()
        .single();

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

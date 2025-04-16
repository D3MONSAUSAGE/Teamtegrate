
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMemberFormData {
  name: string;
  email: string;
  role: string;
}

interface UseTeamMemberFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const useTeamMemberForm = ({ onSuccess, onCancel }: UseTeamMemberFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: '',
    email: '',
    role: 'Developer',
  });

  const handleInputChange = (field: keyof TeamMemberFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Developer',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
      toast.error('Please fill in all fields');
      return;
    }

    // Generate a simple ID - in a real app this would come from the database
    const teamMember = {
      id: `tm-${Date.now()}`, // Simple ID generation for demonstration
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      managerId: user?.id || ''
    };

    // Get existing team members from localStorage or initialize empty array
    const existingMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
    
    // Check if email already exists
    if (existingMembers.some((member: any) => member.email.toLowerCase() === formData.email.toLowerCase())) {
      toast.error('A team member with this email already exists');
      return;
    }
    
    // Add new team member
    const updatedMembers = [...existingMembers, teamMember];
    localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
    
    // Clear form
    resetForm();
    
    toast.success('Team member added successfully');
    onSuccess();
  };

  return {
    formData,
    handleInputChange,
    handleSubmit,
    resetForm,
  };
};

export default useTeamMemberForm;

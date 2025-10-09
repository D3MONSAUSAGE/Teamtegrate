
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { validateInviteCode } from '@/contexts/auth/authOperations';
import { toast } from '@/components/ui/sonner';
import { SignupFormData, CodeValidation, SignupType } from './types';

export const useSignupForm = () => {
  const { signup, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupType, setSignupType] = useState<SignupType>('create');
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    inviteCode: ''
  });
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<CodeValidation | null>(null);

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset code validation when invite code changes
    if (field === 'inviteCode') {
      setCodeValidation(null);
    }
  };

  const validateInviteCodeInput = async () => {
    if (!formData.inviteCode.trim()) {
      setCodeValidation({ isValid: false, error: 'Please enter an invite code' });
      return;
    }

    setValidatingCode(true);
    try {
      const result = await validateInviteCode(formData.inviteCode.trim());
      setCodeValidation({
        isValid: result.success,
        error: result.error
      });
      
      if (result.success) {
        toast.success('Valid invite code!');
      } else {
        toast.error(result.error || 'Invalid invite code');
      }
    } catch (error) {
      setCodeValidation({ isValid: false, error: 'Failed to validate invite code' });
      toast.error('Failed to validate invite code');
    } finally {
      setValidatingCode(false);
    }
  };

  const isFormValid = () => {
    const baseValid = formData.name.trim() && formData.email.trim() && formData.password.trim();
    
    if (signupType === 'create') {
      return baseValid && formData.organizationName.trim();
    } else {
      return baseValid && formData.inviteCode.trim() && codeValidation?.isValid;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      if (signupType === 'create') {
        toast.error('Please fill in all required fields including organization name');
      } else {
        toast.error('Please fill in all fields and validate the invite code');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signup(
        formData.email.trim(),
        formData.password,
        formData.name.trim(),
        'user',  // Default role - will be overridden by invite code if joining
        {
          type: signupType,
          organizationName: signupType === 'create' ? formData.organizationName : undefined,
          inviteCode: signupType === 'join' ? formData.inviteCode : undefined
        }
      );

      if (error) {
        throw error;
      }

      // Success message is shown in the signup function
      // User will be redirected after email verification
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Show specific error messages
      if (error.message.includes('invite')) {
        toast.error('Invite code error: ' + error.message);
      } else if (error.message.includes('email')) {
        toast.error('Email error: ' + error.message);
      } else if (error.message.includes('password')) {
        toast.error('Password error: ' + error.message);
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = loading || isSubmitting;

  return {
    formData,
    signupType,
    setSignupType,
    isSubmitting,
    validatingCode,
    codeValidation,
    handleInputChange,
    validateInviteCodeInput,
    isFormValid,
    handleSubmit,
    isDisabled
  };
};


export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  inviteCode: string;
}

export interface CodeValidation {
  isValid: boolean;
  error?: string;
}

export type SignupType = 'create' | 'join';

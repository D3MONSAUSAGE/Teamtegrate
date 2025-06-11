
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { validateInviteCode } from '@/contexts/auth/authOperations';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MultiTenantSignupFormProps {
  onBack: () => void;
}

const MultiTenantSignupForm: React.FC<MultiTenantSignupFormProps> = ({ onBack }) => {
  const { signup, loading } = useAuth();
  const [signupType, setSignupType] = useState<'create' | 'join'>('create');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    inviteCode: ''
  });
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    if (!formData.password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    // Validate organization data based on signup type
    if (signupType === 'create') {
      if (!formData.organizationName.trim()) {
        toast.error('Please enter an organization name');
        return;
      }
    } else {
      if (!formData.inviteCode.trim()) {
        toast.error('Please enter an invite code');
        return;
      }
      
      if (!codeValidation?.isValid) {
        toast.error('Please validate the invite code first');
        return;
      }
    }

    try {
      const organizationData = {
        type: signupType,
        organizationName: signupType === 'create' ? formData.organizationName : undefined,
        inviteCode: signupType === 'join' ? formData.inviteCode : undefined
      };

      await signup(
        formData.email,
        formData.password,
        formData.name,
        'user', // Will be overridden based on organization type
        organizationData
      );
    } catch (error) {
      console.error('Signup error:', error);
      // Error handling is done in the signup function
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join TeamTegrate</CardTitle>
          <CardDescription>
            Create your account and set up your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Password should be at least 6 characters long
                </p>
              </div>
            </div>

            {/* Organization Setup */}
            <Tabs value={signupType} onValueChange={(value) => setSignupType(value as 'create' | 'join')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Create Organization
                </TabsTrigger>
                <TabsTrigger value="join" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Join Organization
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    placeholder="Enter your organization name"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You'll become the Super Administrator of this organization and can invite team members.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="join" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="inviteCode"
                      placeholder="Enter invite code"
                      value={formData.inviteCode}
                      onChange={(e) => handleInputChange('inviteCode', e.target.value)}
                      className={codeValidation?.isValid ? 'border-green-500' : codeValidation?.error ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateInviteCodeInput}
                      disabled={validatingCode || !formData.inviteCode.trim()}
                    >
                      {validatingCode ? 'Validating...' : 'Validate'}
                    </Button>
                  </div>
                  {codeValidation?.error && (
                    <p className="text-sm text-red-600">{codeValidation.error}</p>
                  )}
                  {codeValidation?.isValid && (
                    <p className="text-sm text-green-600">✓ Valid invite code</p>
                  )}
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You'll join an existing organization as a Team Member. Ask your administrator for an invite code.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiTenantSignupForm;

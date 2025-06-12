
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SignupFormData, CodeValidation, SignupType } from './types';

interface OrganizationSetupSectionProps {
  signupType: SignupType;
  setSignupType: (type: SignupType) => void;
  formData: SignupFormData;
  onInputChange: (field: keyof SignupFormData, value: string) => void;
  validatingCode: boolean;
  codeValidation: CodeValidation | null;
  onValidateInviteCode: () => void;
}

const OrganizationSetupSection: React.FC<OrganizationSetupSectionProps> = ({
  signupType,
  setSignupType,
  formData,
  onInputChange,
  validatingCode,
  codeValidation,
  onValidateInviteCode
}) => {
  return (
    <Tabs value={signupType} onValueChange={(value) => setSignupType(value as SignupType)}>
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
          <Label htmlFor="organizationName">Organization Name *</Label>
          <Input
            id="organizationName"
            placeholder="Enter your organization name"
            value={formData.organizationName}
            onChange={(e) => onInputChange('organizationName', e.target.value)}
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
          <Label htmlFor="inviteCode">Invite Code *</Label>
          <div className="flex gap-2">
            <Input
              id="inviteCode"
              placeholder="Enter invite code"
              value={formData.inviteCode}
              onChange={(e) => onInputChange('inviteCode', e.target.value)}
              className={codeValidation?.isValid ? 'border-green-500' : codeValidation?.error ? 'border-red-500' : ''}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onValidateInviteCode}
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
  );
};

export default OrganizationSetupSection;

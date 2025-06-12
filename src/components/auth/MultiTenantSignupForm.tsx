
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PersonalInfoSection from './signup/PersonalInfoSection';
import OrganizationSetupSection from './signup/OrganizationSetupSection';
import { useSignupForm } from './signup/useSignupForm';

interface MultiTenantSignupFormProps {
  onBack: () => void;
}

const MultiTenantSignupForm: React.FC<MultiTenantSignupFormProps> = ({ onBack }) => {
  const {
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
  } = useSignupForm();

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
            <PersonalInfoSection 
              formData={formData}
              onInputChange={handleInputChange}
            />

            {/* Organization Setup */}
            <OrganizationSetupSection
              signupType={signupType}
              setSignupType={setSignupType}
              formData={formData}
              onInputChange={handleInputChange}
              validatingCode={validatingCode}
              codeValidation={codeValidation}
              onValidateInviteCode={validateInviteCodeInput}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isDisabled}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isDisabled || !isFormValid()}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiTenantSignupForm;

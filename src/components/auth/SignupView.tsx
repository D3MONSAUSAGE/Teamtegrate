
import React from 'react';
import MultiTenantSignupForm from '@/components/auth/MultiTenantSignupForm';

interface SignupViewProps {
  onBack: () => void;
}

const SignupView: React.FC<SignupViewProps> = ({ onBack }) => {
  return (
    <>
      <MultiTenantSignupForm onBack={onBack} />

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Join thousands of teams already using TeamTegrate
        </p>
        <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
          <span>✓ Free 14-day trial</span>
          <span>✓ No credit card required</span>
          <span>✓ Setup in minutes</span>
        </div>
      </div>
    </>
  );
};

export default SignupView;


import React from 'react';
import { useLoginState } from '@/hooks/useLoginState';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginCard from '@/components/auth/LoginCard';
import SignupView from '@/components/auth/SignupView';

const SimpleLoginPage = () => {
  const {
    isLogin,
    isSubmitting,
    loginError,
    handleLogin,
    handleBackToLogin,
    handleSwitchToSignup
  } = useLoginState();

  // Show signup form
  if (!isLogin) {
    return (
      <AuthLayout>
        <SignupView onBack={handleBackToLogin} />
      </AuthLayout>
    );
  }
  
  // Show login form
  return (
    <AuthLayout>
      <LoginCard
        onSubmit={handleLogin}
        isSubmitting={isSubmitting}
        loginError={loginError}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </AuthLayout>
  );
};

export default SimpleLoginPage;


import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginState } from '@/hooks/useLoginState';
import { useAuth } from '@/contexts/SimpleAuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginCard from '@/components/auth/LoginCard';
import SignupView from '@/components/auth/SignupView';

const SimpleLoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const {
    isLogin,
    isSubmitting,
    loginError,
    handleLogin,
    handleBackToLogin,
    handleSwitchToSignup
  } = useLoginState();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('SimpleLoginPage: User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="text-lg">Checking authentication...</div>
        </div>
      </AuthLayout>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

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

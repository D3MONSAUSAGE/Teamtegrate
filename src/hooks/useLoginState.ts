
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';

export const useLoginState = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('signup'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  console.log('useLoginState: Auth state:', { 
    isAuthenticated, 
    authLoading: loading, 
    formSubmitting: isSubmitting,
    isLogin
  });

  // Redirect after successful authentication
  useEffect(() => {
    if (isAuthenticated && !loading && !isSubmitting) {
      console.log('useLoginState: Authentication successful, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, isSubmitting, navigate]);

  // Handle signup parameter from URL
  useEffect(() => {
    if (searchParams.get('signup')) {
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleLogin = async (email: string, password: string) => {
    if (isSubmitting) return;

    // Simple validation
    if (!email.trim() || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    setIsSubmitting(true);
    setLoginError(null);
    console.log('useLoginState: Starting login for:', email);
    
    try {
      await login(email.trim(), password);
      console.log('useLoginState: Login call completed');
      // Don't redirect here - let the useEffect handle it after auth state updates
    } catch (error) {
      console.error('useLoginState: Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      setLoginError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setIsLogin(true);
    setLoginError(null);
  };

  const handleSwitchToSignup = () => {
    setIsLogin(false);
    setLoginError(null);
  };

  return {
    isLogin,
    isSubmitting,
    loginError,
    handleLogin,
    handleBackToLogin,
    handleSwitchToSignup
  };
};

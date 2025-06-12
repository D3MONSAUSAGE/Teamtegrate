
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

  // Redirect if already logged in - but only after loading is complete
  useEffect(() => {
    if (!loading && isAuthenticated) {
      console.log('useLoginState: User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Handle signup parameter from URL
  useEffect(() => {
    if (searchParams.get('signup')) {
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleLogin = async (email: string, password: string) => {
    if (isSubmitting) {
      return;
    }

    // Simple validation - allow empty fields to show server error
    if (!email.trim() && !password) {
      setLoginError('Please enter your email and password');
      return;
    }

    if (!email.trim()) {
      setLoginError('Please enter your email address');
      return;
    }

    if (!password) {
      setLoginError('Please enter your password');
      return;
    }
    
    setIsSubmitting(true);
    setLoginError(null);
    console.log('useLoginState: Starting login for:', email);
    
    try {
      await login(email.trim(), password);
      console.log('useLoginState: Login successful');
      // Navigation will happen via useEffect when isAuthenticated changes
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

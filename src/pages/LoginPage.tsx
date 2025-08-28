
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';
import MultiTenantSignupForm from '@/components/auth/MultiTenantSignupForm';
import { supabase } from '@/integrations/supabase/client';
import { isSafari, isAppleDevice, getSafeFormSubmissionHandler } from '@/lib/browser';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('signup'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      console.log('LoginPage: User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle signup parameter from URL
  useEffect(() => {
    if (searchParams.get('signup')) {
      setIsLogin(false);
    }
  }, [searchParams]);

  // Mobile keyboard handling - scroll active input into view
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          (e.target as HTMLElement)?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 300); // Wait for keyboard animation
      }
    };

    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
      });
    };
  }, [isLogin]);
  
  const handleSubmitForm = async (e: React.FormEvent) => {
    console.log('LoginPage: Form submission started, browser:', { 
      isSafari: isSafari(), 
      isAppleDevice: isAppleDevice() 
    });
    
    if (!isLogin) {
      return;
    }

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('LoginPage: Attempting login for:', email);
      
      // For Safari/Apple devices, add a small delay to ensure form state is properly handled
      if (isSafari() || isAppleDevice()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const { error } = await login(email, password);

      if (error) {
        console.error('LoginPage: Authentication error:', error);
        let errorMessage = 'Login failed. Please try again.';

        if (error?.message) {
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address before signing in.';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Too many login attempts. Please wait a moment and try again.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Connection error. Please check your internet connection and try again.';
          }
        }

        // For Safari, ensure the error is displayed with a slight delay
        if (isSafari() || isAppleDevice()) {
          setTimeout(() => {
            toast.error(errorMessage);
          }, 50);
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      console.log('LoginPage: Login successful');
      toast.success('Welcome back!');
      
      // Explicit navigation for Safari compatibility
      if (isSafari() || isAppleDevice()) {
        // Add a small delay for Safari to process auth state changes
        setTimeout(() => {
          console.log('LoginPage: Safari - navigating to dashboard');
          navigate('/dashboard', { replace: true });
        }, 150);
      } else {
        // Immediate navigation for other browsers
        console.log('LoginPage: Navigating to dashboard');
        navigate('/dashboard', { replace: true });
      }
    } catch (e) {
      console.error('LoginPage: Unexpected login error:', e);
      const errorMessage = 'Login failed. Please try again.';
      
      // For Safari, ensure the error is displayed with a slight delay
      if (isSafari() || isAppleDevice()) {
        setTimeout(() => {
          toast.error(errorMessage);
        }, 50);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Safari-safe form submission handler
  const handleSubmit = getSafeFormSubmissionHandler(handleSubmitForm);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResettingPassword(true);
    
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error('Failed to send password reset email. Please try again.');
        return;
      }

      toast.success('Password reset email sent! Check your inbox for instructions.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      toast.error('Failed to send password reset email. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleBackToLogin = () => {
    setIsLogin(true);
  };
  
  if (!isLogin) {
    return (
      <div className="min-h-screen-mobile flex items-center justify-center bg-gradient-to-br from-background to-muted safe-area-all">
        <div className="w-full max-w-md px-4">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors tap-highlight-none native-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </div>

          <MultiTenantSignupForm onBack={handleBackToLogin} />

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
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen-mobile flex items-center justify-center bg-gradient-to-br from-background to-muted safe-area-all">
      <div className="w-full max-w-md px-4 keyboard-aware">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors tap-highlight-none native-button">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        <Card className="w-full mobile-card shadow-xl border-0">
          <CardHeader className="text-center px-6 pt-8 pb-6">
            <div className="flex justify-center mb-4">
              <BrandLogo size="md" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to access your team workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              action=""
              method="post"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-12 px-4 text-base rounded-xl border-2 focus:border-primary transition-colors"
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-12 px-4 text-base rounded-xl border-2 focus:border-primary transition-colors"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs native-button"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl native-button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="px-6 pb-8">
            <Button
              variant="link"
              className="w-full h-12 text-base native-button"
              onClick={() => setIsLogin(false)}
              disabled={isSubmitting}
            >
              Don't have an account? Sign up for free
            </Button>
          </CardFooter>
        </Card>

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Reset Password
              </DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email Address</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResettingPassword}
                  required
                  className="h-12 px-4 text-base rounded-xl"
                  autoComplete="email"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                  disabled={isResettingPassword}
                  className="native-button"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isResettingPassword || !resetEmail}
                  className="native-button"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LoginPage;

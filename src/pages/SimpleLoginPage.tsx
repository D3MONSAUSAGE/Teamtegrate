import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';
import MultiTenantSignupForm from '@/components/auth/MultiTenantSignupForm';

const SimpleLoginPage = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('signup'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  // Detailed logging for debugging
  const isFormValid = email.trim().length > 0 && password.length > 0;
  const isFormDisabled = isSubmitting || !isFormValid; // Removed loading dependency
  
  console.log('SimpleLoginPage: Auth state:', { 
    isAuthenticated, 
    authLoading: loading, 
    formSubmitting: isSubmitting,
    email: email,
    password: password.length > 0 ? '[HIDDEN]' : 'empty',
    emailValid: email.trim().length > 0,
    passwordValid: password.length > 0,
    isFormValid,
    isFormDisabled,
    buttonShouldBeEnabled: !isFormDisabled
  });
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('SimpleLoginPage: User authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  // Handle signup parameter from URL
  useEffect(() => {
    if (searchParams.get('signup')) {
      setIsLogin(false);
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin) {
      return;
    }
    
    if (isSubmitting) {
      console.log('SimpleLoginPage: Already submitting, ignoring duplicate submit');
      return;
    }

    // Validate form fields
    if (!email.trim() || !password) {
      console.log('SimpleLoginPage: Form validation failed - missing email or password');
      return;
    }
    
    setIsSubmitting(true);
    console.log('SimpleLoginPage: Starting login for:', email);
    
    try {
      await login(email.trim(), password);
      console.log('SimpleLoginPage: Login successful');
    } catch (error) {
      console.error('SimpleLoginPage: Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setIsLogin(true);
  };
  
  // Show signup form
  if (!isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <BrandLogo size="md" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your team workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isFormDisabled}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              variant="link"
              className="w-full"
              onClick={() => setIsLogin(false)}
              disabled={isSubmitting}
            >
              Don't have an account? Sign up for free
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SimpleLoginPage;

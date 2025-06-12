
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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';
import MultiTenantSignupForm from '@/components/auth/MultiTenantSignupForm';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('signup'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  console.log('🔍 LoginPage: Rendering with state:', {
    isAuthenticated,
    authLoading,
    isSubmitting,
    loginError
  });
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('✅ LoginPage: User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle signup parameter from URL
  useEffect(() => {
    if (searchParams.get('signup')) {
      setIsLogin(false);
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin) {
      return; // Signup handled by MultiTenantSignupForm
    }

    if (isSubmitting) {
      console.log('⚠️ LoginPage: Submit already in progress, ignoring');
      return;
    }

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    console.log('🔑 LoginPage: Starting login process');
    
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      console.log('🔑 LoginPage: Calling auth login...');
      await login(email, password);
      
      console.log('✅ LoginPage: Login completed successfully');
      // Auth state will handle redirect
      
    } catch (error) {
      console.error('❌ LoginPage: Login failed:', error);
      setIsSubmitting(false);
      
      let errorMessage = 'Login failed';
      
      if (error instanceof Error) {
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message?.includes('network') || error.message?.includes('500')) {
          errorMessage = 'Database connection issues. Please try again.';
        } else if (error.message?.includes('403') || error.message?.includes('unauthorized')) {
          errorMessage = 'Authentication service unavailable. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setLoginError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleBackToLogin = () => {
    setIsLogin(true);
    setIsSubmitting(false);
    setLoginError(null);
  };

  const handleTestLogin = () => {
    setEmail('generalmanager@guanatostacos.com');
    setPassword('12345678');
    setLoginError(null);
    console.log('🧪 LoginPage: Test credentials populated');
  };
  
  if (!isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          {/* Back to landing page link */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </div>

          <MultiTenantSignupForm onBack={handleBackToLogin} />

          {/* Additional marketing copy for signup */}
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
        {/* Back to landing page link */}
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
                  disabled={isSubmitting}
                  required
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
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Debug section for testing */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestLogin}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Use Test Credentials
                </Button>
              </div>

              {/* Error display */}
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                    <p className="text-sm text-red-800">{loginError}</p>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
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

        {/* Show database status warning if there are ongoing issues */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Note:</strong> If you experience login issues, try refreshing the page. 
            Database connectivity is being improved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

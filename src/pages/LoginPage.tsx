
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [processingRedirect, setProcessingRedirect] = useState(false);
  const { login, signup, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('LoginPage Render', { loading, isAuthenticated, processingRedirect });

  // Handle auth redirect from email verification
  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check if we have hash parameters from a redirect
      if (window.location.hash && !processingRedirect) {
        console.log('LoginPage: Hash found in URL');
        setProcessingRedirect(true);
        
        try {
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');
          
          console.log('LoginPage: Tokens', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
          
          if (accessToken && refreshToken) {
            console.log('LoginPage: Setting session with tokens');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            console.log('LoginPage: Session Set Result', { data: !!data, error });
            
            if (error) {
              throw error;
            }
            
            if (type === 'signup') {
              toast.success('Email verified! You are now signed in.');
            } else {
              toast.success('You are now signed in.');
            }
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to dashboard
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('LoginPage: Error setting session:', error);
          toast.error('Authentication failed. Please try again.');
          setProcessingRedirect(false);
        }
      }
    };
    
    handleAuthRedirect();
  }, [navigate]);
  
  // Redirect if already logged in
  useEffect(() => {
    console.log('LoginPage: Checking authentication state', { isAuthenticated, loading });
    if (isAuthenticated && !loading && !processingRedirect) {
      console.log('LoginPage: User is authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate, processingRedirect]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('LoginPage: Submitting form', { isLogin, email });
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          toast.error('Please enter your name');
          return;
        }
        await signup(email, password, name, role);
      }
      // The redirect will be handled by the useEffect above
    } catch (error) {
      console.error('LoginPage: Authentication error:', error);
      // Error toasts are already handled in the auth context
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Daily Team Sync</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to access your tasks and projects' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {!isLogin && (
              <div className="space-y-2">
                <Label>Account Type</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="user" />
                    <Label htmlFor="user">User</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manager" id="manager" />
                    <Label htmlFor="manager">Manager</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading || processingRedirect}>
              {isLogin 
                ? (loading ? 'Logging in...' : 'Login') 
                : (loading ? 'Signing Up...' : 'Sign Up')}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            variant="link"
            className="w-full"
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading || processingRedirect}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;

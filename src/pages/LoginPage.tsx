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
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('signup'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const role: UserRole = 'user';
  const { login, signup, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !loading) {
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
    
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        if (!name.trim()) {
          toast.error('Please enter your name');
          return;
        }
        await signup(email, password, name, role);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };
  
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
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Welcome Back' : 'Join TeamTegrate'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to access your team workspace' 
                : 'Create your account and start collaborating'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">
                    Password should be at least 6 characters long
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {isLogin 
                  ? (loading ? 'Signing in...' : 'Sign In') 
                  : (loading ? 'Creating account...' : 'Create Account')
                }
              </Button>
            </form>

            {!isLogin && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="link"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin 
                ? "Don't have an account? Sign up for free" 
                : "Already have an account? Sign in"
              }
            </Button>
          </CardFooter>
        </Card>

        {/* Additional marketing copy for signup */}
        {!isLogin && (
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
        )}
      </div>
    </div>
  );
};

export default LoginPage;


import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BrandLogo from '@/components/shared/BrandLogo';
import LoginForm from './LoginForm';

interface LoginCardProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isSubmitting: boolean;
  loginError: string | null;
  onSwitchToSignup: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({
  onSubmit,
  isSubmitting,
  loginError,
  onSwitchToSignup
}) => {
  return (
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
        <LoginForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          loginError={loginError}
          onSwitchToSignup={onSwitchToSignup}
        />
      </CardContent>
    </Card>
  );
};

export default LoginCard;


import React from 'react';
import { Link } from 'react-router-dom';

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        <p className="text-center text-muted-foreground">Password reset functionality coming soon</p>
        <Link to="/login" className="block text-center text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

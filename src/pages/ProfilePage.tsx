
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHeader from '@/components/profile/ProfileHeader';
import AccountSecuritySection from '@/components/profile/AccountSecuritySection';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto bg-gray-50 dark:bg-background min-h-screen">
      <div className="space-y-8">
        {/* Profile Header */}
        <ProfileHeader />
        
        {/* Account Security Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Security & Privacy</h2>
          <AccountSecuritySection />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

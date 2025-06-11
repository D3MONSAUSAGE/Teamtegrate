
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SettingsLayout from '@/components/settings/SettingsLayout';
import ProfileSection from '@/components/settings/ProfileSection';
import AccountSettingsSection from '@/components/settings/AccountSettingsSection';
import AppSettingsSection from '@/components/settings/AppSettingsSection';
import NotificationSettings from '@/components/settings/NotificationSettings';

const SettingsPage = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SettingsLayout>
      <div className="space-y-8">
        <ProfileSection />
        <NotificationSettings />
        <AccountSettingsSection />
        <AppSettingsSection />
      </div>
    </SettingsLayout>
  );
};

export default SettingsPage;


import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SettingsLayout from '@/components/settings/SettingsLayout';
import AppSettingsSection from '@/components/settings/AppSettingsSection';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SoundSettings from '@/components/settings/SoundSettings';
import NotificationTester from '@/components/NotificationTester';
import GoogleCalendarSyncPreferences from '@/components/meetings/GoogleCalendarSyncPreferences';
import GoogleTasksSyncButtons from '@/components/task/GoogleTasksSyncButtons';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const SettingsPage = () => {
  const { user, isLoading } = useAuth();
  const { isConnected } = useGoogleCalendar();
  const [googleConnected, setGoogleConnected] = useState(isConnected);

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
        <div>
          <h2 className="text-2xl font-bold mb-4">Application Settings</h2>
          <p className="text-muted-foreground mb-6">
            Configure your app preferences and notification settings. For profile information, 
            visit your <a href="/dashboard/profile" className="text-primary hover:underline">Profile page</a>.
          </p>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Google Integration</h2>
          <p className="text-muted-foreground mb-6">
            Connect and sync with Google Calendar and Google Tasks to streamline your productivity.
          </p>
          <GoogleCalendarSyncPreferences 
            isConnected={googleConnected}
            onConnectionChange={setGoogleConnected}
          />
          {googleConnected && (
            <div className="mt-6">
              <GoogleTasksSyncButtons />
            </div>
          )}
        </div>
        
        <NotificationSettings />
        <SoundSettings />
        <NotificationTester />
        <AppSettingsSection />
      </div>
    </SettingsLayout>
  );
};

export default SettingsPage;

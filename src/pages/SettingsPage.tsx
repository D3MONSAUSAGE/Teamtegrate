
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Separator } from "@/components/ui/separator";
import SettingsLayout from '@/components/settings/SettingsLayout';
import ProfileSection from '@/components/settings/ProfileSection';
import AppSettingsSection from '@/components/settings/AppSettingsSection';
import AccountSettingsSection from '@/components/settings/AccountSettingsSection';
import { useAuth } from '@/contexts/AuthContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);
  
  const handleCancel = () => {
    navigate('/dashboard');
  };
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return null; // Will be redirected by the useEffect
  }
  
  return (
    <SettingsLayout onCancel={handleCancel}>
      <ProfileSection />
      
      <Separator />
      
      <AppSettingsSection />
      
      <Separator />
      
      <AccountSettingsSection />
    </SettingsLayout>
  );
};

export default SettingsPage;

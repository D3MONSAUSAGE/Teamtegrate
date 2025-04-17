
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Separator } from "@/components/ui/separator";
import SettingsLayout from '@/components/settings/SettingsLayout';
import ProfileSection from '@/components/settings/ProfileSection';
import AppSettingsSection from '@/components/settings/AppSettingsSection';
import AccountSettingsSection from '@/components/settings/AccountSettingsSection';

const SettingsPage = () => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    navigate('/dashboard');
  };
  
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

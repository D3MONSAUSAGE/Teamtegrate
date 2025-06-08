
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActivity from '@/components/profile/ProfileActivity';
import ProfileTeamOverview from '@/components/profile/ProfileTeamOverview';
import ProfileQuickActions from '@/components/profile/ProfileQuickActions';
import AdminUserManagement from '@/components/profile/AdminUserManagement';

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
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Profile Header Section */}
        <ProfileHeader />
        
        {/* Statistics Dashboard */}
        <ProfileStats />
        
        {/* Quick Actions Panel */}
        <ProfileQuickActions />
        
        {/* Admin User Management - Only show for managers */}
        {user.role === 'manager' && <AdminUserManagement />}
        
        {/* Team & Project Overview */}
        <ProfileTeamOverview />
        
        {/* Recent Activity Feed */}
        <ProfileActivity />
      </div>
    </div>
  );
};

export default ProfilePage;

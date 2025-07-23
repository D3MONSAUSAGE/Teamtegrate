import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileProfilePage from './MobileProfilePage';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import ProfessionalProfileHeader from '@/components/profile/ProfessionalProfileHeader';
import ProfessionalProfileStats from '@/components/profile/ProfessionalProfileStats';
import ProfessionalActivity from '@/components/profile/ProfessionalActivity';
import ProfileTeamOverview from '@/components/profile/ProfileTeamOverview';
import ProfessionalQuickActions from '@/components/profile/ProfessionalQuickActions';
import SkillsCompetenciesSection from '@/components/profile/SkillsCompetenciesSection';
import AccountSecuritySection from '@/components/profile/AccountSecuritySection';

const ProfilePage = () => {
  const isMobile = useIsMobile();

  // Render mobile version for mobile devices
  if (isMobile) {
    return <MobileProfilePage />;
  }

  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const { projects } = useProjects();

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
    <div className="p-3 sm:p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-background min-h-screen">
      <div className="space-y-8">
        {/* Professional Profile Header */}
        <ProfessionalProfileHeader />
        
        {/* Performance Dashboard */}
        <ProfessionalProfileStats />
        
        {/* Skills & Competencies */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Skills & Development</h2>
          <SkillsCompetenciesSection />
        </div>
        
        {/* Professional Actions */}
        <ProfessionalQuickActions />
        
        {/* Team & Project Overview */}
        <ProfileTeamOverview projects={projects} user={user} />
        
        {/* Professional Activity Feed */}
        <ProfessionalActivity />
        
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

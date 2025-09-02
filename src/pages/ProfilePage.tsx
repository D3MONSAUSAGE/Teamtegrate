
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PersonalInfoSection from '@/components/profile/PersonalInfoSection';
import EmergencyContactsSection from '@/components/profile/EmergencyContactsSection';
import TeamStructureSection from '@/components/profile/TeamStructureSection';
import TrainingProgressSection from '@/components/profile/TrainingProgressSection';
import AccountSecuritySection from '@/components/profile/AccountSecuritySection';
import { useEnhancedProfile } from '@/hooks/useEnhancedProfile';
import { User, Users, Award, Shield, Phone } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, isOwnProfile } = useEnhancedProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    navigate('/login');
    return null;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Profile not found.</div>
      </div>
    );
  }

  const canEditProfile = isOwnProfile || ['admin', 'superadmin'].includes(currentUser.role);
  const canViewTeamStructure = true; // All users can view team structure
  const canViewTraining = true; // All users can view their training

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Enhanced Profile Header */}
        <ProfileHeader />
        
        {/* Main Profile Content */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="emergency" className="gap-2">
              <Phone className="h-4 w-4" />
              Emergency
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <Award className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <PersonalInfoSection 
              user={profile.user}
              onUpdate={updateProfile}
              canEdit={canEditProfile}
            />
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <EmergencyContactsSection canEdit={canEditProfile} />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            {canViewTeamStructure ? (
              <TeamStructureSection profile={profile} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                You don't have permission to view team structure information.
              </div>
            )}
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            {canViewTraining ? (
              <TrainingProgressSection profile={profile} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                You don't have permission to view training information.
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <AccountSecuritySection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;

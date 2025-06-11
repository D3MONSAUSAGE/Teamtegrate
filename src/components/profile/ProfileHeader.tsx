
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Settings, Calendar, User, Crown, Users, Shield, Star, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from '@/components/settings/ProfileSection/ProfileAvatar';
import ProfileInfoForm from '@/components/settings/ProfileSection/ProfileInfoForm';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole, getRoleDisplayName } from '@/types';
import { cn } from "@/lib/utils";

const ProfileHeader = () => {
  console.log("ProfileHeader rendering");
  const { user, refreshUserSession } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string>(user?.name || user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching avatar:", error);
          return;
        }
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };
    
    fetchAvatar();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) {
        throw error;
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshRole = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserSession();
      toast.success("Role information refreshed!");
    } catch (error) {
      console.error("Error refreshing role:", error);
      toast.error("Failed to refresh role information");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <Star className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return 'default';
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleGradient = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return 'from-purple-50 via-white to-yellow-50/30 dark:from-purple-900/20 dark:via-gray-900 dark:to-yellow-900/20';
      case 'admin':
        return 'from-red-50 via-white to-orange-50/30 dark:from-red-900/20 dark:via-gray-900 dark:to-orange-900/20';
      case 'manager':
        return 'from-blue-50 via-white to-purple-50/30 dark:from-blue-900/20 dark:via-gray-900 dark:to-purple-900/20';
      default:
        return 'from-gray-50 via-white to-blue-50/30 dark:from-gray-900/20 dark:via-gray-900 dark:to-blue-900/20';
    }
  };

  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  console.log("ProfileHeader about to render main content");

  return (
    <Card className={`bg-gradient-to-br ${getRoleGradient(user.role)} border-none shadow-lg`}>
      <CardContent className="p-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8 flex-1">
            <div className="flex flex-col items-center lg:items-start">
              <ProfileAvatar 
                user={{ 
                  id: user.id, 
                  name: user.name || user.email || 'User'
                }} 
                setAvatarUrl={setAvatarUrl} 
                avatarUrl={avatarUrl} 
              />
              <div className="mt-4 text-center lg:text-left flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getRoleIcon(user.role)}
                  <Badge 
                    variant={getRoleBadgeVariant(user.role)} 
                    className="px-3 py-1"
                  >
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </div>
                <button
                  onClick={handleRefreshRole}
                  disabled={isRefreshing}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-6 w-6 p-0"
                  )}
                  title="Refresh role information"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <ProfileInfoForm
                user={{
                  id: user.id,
                  name: user.name || user.email || 'User',
                  email: user.email,
                  role: user.role
                }}
                name={name}
                setName={setName}
                onSave={handleSave}
                isLoading={isLoading}
              />
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Member since</span>
                  </div>
                  <div className="font-semibold">
                    {/* Use current date as fallback since AppUser doesn't have createdAt */}
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Access Level</span>
                  </div>
                  <div className="font-semibold">
                    {getRoleDisplayName(user.role)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-[200px]">
            <button 
              onClick={() => navigate('/dashboard/calendar')}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hover:bg-blue-50 dark:hover:bg-blue-900/20"
              )}
            >
              <Calendar className="h-4 w-4" />
              View Calendar
            </button>
            <button 
              onClick={() => navigate('/dashboard/settings')}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;

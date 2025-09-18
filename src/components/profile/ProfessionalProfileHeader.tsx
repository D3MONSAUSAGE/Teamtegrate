
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Settings, Calendar, User, Crown, Users, Shield, Star, RefreshCw, Mail, Phone, MapPin, Building, IdCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from '@/components/settings/ProfileSection/ProfileAvatar';
import ProfileInfoForm from '@/components/settings/ProfileSection/ProfileInfoForm';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRole, getRoleDisplayName } from '@/types';
import { cn } from "@/lib/utils";

const ProfessionalProfileHeader = () => {
  const { user, refreshUserSession, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string>(user?.name || user?.email || "");
  const [email, setEmail] = useState<string>(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || user.email || "");
      setEmail(user.email || "");
    }
  }, [user]);

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
      const updates: { name?: string; email?: string } = {};
      
      if (name !== user.name) {
        updates.name = name;
      }
      
      if (email !== user.email) {
        updates.email = email;
        toast.info("Email change may require Google Calendar re-authentication");
      }

      if (Object.keys(updates).length > 0) {
        await updateUserProfile(updates);
        toast.success("Profile updated successfully!");
      } else {
        toast.info("No changes to save");
      }
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

  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <Card className="bg-white dark:bg-card border shadow-sm">
      <CardContent className="p-8">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8 mb-8">
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
              <div className="mt-4 text-center lg:text-left">
                <h1 className="text-2xl font-bold text-foreground">{user.name || user.email}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {getRoleIcon(user.role)}
                  <Badge 
                    variant={getRoleBadgeVariant(user.role)} 
                    className="px-3 py-1"
                  >
                    {getRoleDisplayName(user.role)}
                  </Badge>
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
                email={email}
                setEmail={setEmail}
                onSave={handleSave}
                isLoading={isLoading}
              />
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
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </button>
            <button 
              onClick={() => navigate('/dashboard/settings')}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Employee Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Mail className="h-4 w-4" />
              <span>Email Address</span>
            </div>
            <div className="font-medium text-foreground">{user.email}</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <IdCard className="h-4 w-4" />
              <span>Employee ID</span>
            </div>
            <div className="font-medium text-foreground">
              {user.id.substring(0, 8).toUpperCase()}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building className="h-4 w-4" />
              <span>Department</span>
            </div>
            <div className="font-medium text-foreground">
              {getRoleDisplayName(user.role)} Department
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>Start Date</span>
            </div>
            <div className="font-medium text-foreground">
              {user.createdAt ? user.createdAt.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              }) : new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalProfileHeader;

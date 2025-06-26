
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Calendar, Crown, Shield, Sparkles } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/contexts/AuthContext';

const OrganizationHeader: React.FC = () => {
  const { data: organization, isLoading, error } = useOrganization();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-card/90 dark:via-card/80 dark:to-card/70 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="animate-pulse flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
              <div className="w-10 h-10 bg-primary/30 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-4 flex-1">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-72 animate-pulse" />
              <div className="flex gap-6">
                <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-32 animate-pulse" />
                <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-40 animate-pulse" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 shadow-2xl bg-gradient-to-br from-red-50 via-red-50/80 to-red-100/60 dark:from-red-950/50 dark:via-red-950/40 dark:to-red-900/30">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 text-destructive">
            <div className="p-3 rounded-2xl bg-destructive/10">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Error Loading Organization</h3>
              <p className="text-sm opacity-80">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card className="border-orange-200 shadow-2xl bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-100/60 dark:from-orange-950/50 dark:via-orange-950/40 dark:to-orange-900/30">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 text-orange-600 dark:text-orange-400">
            <div className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-900/30">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Organization Found</h3>
              <p className="text-sm opacity-80">No organization found for your account</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'manager':
        return <Users className="h-5 w-5 text-green-500" />;
      default:
        return <Users className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'admin':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'manager':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 dark:border-green-700';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 dark:from-gray-800/30 dark:to-slate-800/30 dark:text-gray-300 dark:border-gray-600';
    }
  };

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-xl hover:shadow-3xl transition-all duration-500 group">
      <CardContent className="p-8">
        <div className="flex items-center gap-6">
          {/* Organization Icon */}
          <div className="relative">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-500">
              <Building2 className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </div>
          </div>
          
          {/* Organization Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                {organization.name}
              </h2>
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700">
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">Active</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {/* Role Badge */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getRoleStyle(user?.role || 'user')} font-semibold transition-all hover:scale-105`}>
                {getRoleIcon(user?.role || 'user')}
                <span>Your Role: {user?.role}</span>
              </div>
              
              {/* Member Since */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Calendar className="h-4 w-4" />
                <span>Member since: {memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationHeader;

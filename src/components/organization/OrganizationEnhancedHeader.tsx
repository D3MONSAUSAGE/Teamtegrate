
import React from 'react';
import { Button } from "@/components/ui/button";
import { Shield, Users, TrendingUp, Calendar, Zap, Building2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrganizationEnhancedHeaderProps {
  onInviteUsers: () => void;
}

const OrganizationEnhancedHeader: React.FC<OrganizationEnhancedHeaderProps> = ({
  onInviteUsers
}) => {
  const { user } = useAuth();
  const { data: organization } = useOrganization();
  const { stats } = useOrganizationStats();
  const isMobile = useIsMobile();

  const canInviteUsers = user && ['superadmin', 'admin'].includes(user.role);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 border border-primary/10">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/90 to-card/95 backdrop-blur-sm" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Organization Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all duration-500">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-500 animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
                  {organization?.name || 'Organization'}
                </h1>
                <div className="flex items-center gap-4 text-base md:text-lg mt-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-border" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>Organization Management</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 pt-2">
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-primary group-hover:scale-110 transition-transform">
                  {stats?.total_users || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
                  {stats?.active_projects || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
                  {stats ? Math.round((stats.completed_tasks / Math.max(stats.total_tasks, 1)) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex-shrink-0 space-y-3">
            {canInviteUsers && (
              <Button 
                onClick={onInviteUsers} 
                size={isMobile ? "default" : "lg"} 
                className="w-full lg:w-auto relative overflow-hidden bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Invite Users
                </div>
              </Button>
            )}
            
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Role: {user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationEnhancedHeader;

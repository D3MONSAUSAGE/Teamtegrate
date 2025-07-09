
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Plus,
  Settings,
  Download,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';

interface ProfessionalOrganizationHeaderProps {
  onInviteUsers: () => void;
  onExportData?: () => void;
  onSettings?: () => void;
}

const ProfessionalOrganizationHeader: React.FC<ProfessionalOrganizationHeaderProps> = ({
  onInviteUsers,
  onExportData,
  onSettings
}) => {
  const { user } = useAuth();
  const { data: organization } = useOrganization();
  const { stats } = useOrganizationStats();

  const canInviteUsers = user && ['superadmin', 'admin'].includes(user.role);
  const completionRate = stats ? Math.round((stats.completed_tasks / Math.max(stats.total_tasks, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Main Header Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background/95 to-muted/30 shadow-2xl">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Organization Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300" />
                  <div className="relative p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl border border-primary/20 backdrop-blur-sm">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-purple-500 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
                    {organization?.name || 'Organization'}
                  </h1>
                  <div className="flex items-center gap-4 text-lg">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                    </div>
                    <div className="hidden sm:block w-px h-5 bg-border" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span>Management Dashboard</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="group cursor-pointer">
                  <div className="text-3xl lg:text-4xl font-bold text-primary group-hover:scale-110 transition-transform duration-200">
                    {stats?.total_users || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Team Members</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl lg:text-4xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-200">
                    {stats?.active_projects || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Active Projects</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl lg:text-4xl font-bold text-emerald-600 group-hover:scale-110 transition-transform duration-200">
                    {completionRate}%
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Completion Rate</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl lg:text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-200">
                    {stats?.total_tasks || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Total Tasks</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-4 min-w-fit">
              {canInviteUsers && (
                <Button 
                  onClick={onInviteUsers} 
                  size="lg" 
                  className="relative overflow-hidden bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Invite Team Members
                  </div>
                </Button>
              )}
              
              <div className="flex gap-2">
                {onExportData && (
                  <Button variant="outline" size="lg" onClick={onExportData} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
                {onSettings && (
                  <Button variant="outline" size="lg" onClick={onSettings} className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {user?.role}
                  </Badge>
                </div>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfessionalOrganizationHeader;

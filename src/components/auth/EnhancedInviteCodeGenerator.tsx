
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Users, UserPlus, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types';

const EnhancedInviteCodeGenerator: React.FC = () => {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [expiryDays, setExpiryDays] = useState<string>('7');
  const [maxUses, setMaxUses] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');

  // Fetch teams for the organization
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['organization-teams', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, name, description')
          .eq('organization_id', user.organizationId)
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching teams:', error);
        return [];
      }
    },
    enabled: !!user?.organizationId
  });

  const generateEnhancedInviteCode = async (
    organizationId: string,
    role: UserRole,
    teamId?: string,
    expiryDays: number = 7,
    maxUses?: number
  ): Promise<{ success: boolean; inviteCode?: string; error?: string }> => {
    try {
      setConnectionError('');
      
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (testError) {
        setConnectionError('Database connection failed. Please check your connection and try again.');
        return { success: false, error: 'Database connection failed' };
      }

      // Check if the function exists
      const { data, error } = await supabase.rpc('generate_invite_code_with_role', {
        org_id: organizationId,
        created_by_id: user?.id,
        invited_role: role,
        invited_team_id: teamId || null,
        expires_days: expiryDays,
        max_uses_param: maxUses || null
      });

      if (error) {
        console.error('Error generating enhanced invite code:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('function')) {
          return { success: false, error: 'Invite code generation service is not available. Please contact your system administrator.' };
        } else if (error.message?.includes('permission')) {
          return { success: false, error: 'You do not have permission to generate invite codes.' };
        } else if (error.message?.includes('organization')) {
          return { success: false, error: 'Invalid organization. Please refresh the page and try again.' };
        }
        
        return { success: false, error: error.message || 'Failed to generate invite code' };
      }

      return { success: true, inviteCode: data };
    } catch (error) {
      console.error('Error in generateEnhancedInviteCode:', error);
      setConnectionError('An unexpected error occurred. Please try again.');
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const handleGenerateCode = async () => {
    if (!user?.organizationId) {
      toast.error('Organization not found');
      return;
    }

    setGenerating(true);
    setConnectionError('');
    
    try {
      const result = await generateEnhancedInviteCode(
        user.organizationId,
        selectedRole,
        selectedTeam || undefined,
        parseInt(expiryDays),
        maxUses ? parseInt(maxUses) : undefined
      );

      if (result.success && result.inviteCode) {
        setInviteCode(result.inviteCode);
        toast.success('Enhanced invite code generated successfully!');
      } else {
        toast.error(result.error || 'Failed to generate invite code');
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast.error('Failed to generate invite code');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success('Invite code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Only show to superadmins
  if (user?.role !== 'superadmin') {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Only super administrators can generate invite codes.
        </AlertDescription>
      </Alert>
    );
  }

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'user', label: 'User', description: 'Basic user with limited permissions' },
    { value: 'manager', label: 'Manager', description: 'Can manage projects and team members' },
    { value: 'admin', label: 'Admin', description: 'Can manage users and organization settings' }
  ];

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-card/90 dark:via-card/80 dark:to-card/70 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Generate Enhanced Invite Code
          </span>
          <Sparkles className="h-4 w-4 text-accent animate-pulse" />
        </CardTitle>
        <CardDescription>
          Create invite codes with specific roles and optional team assignments for new users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Error Alert */}
        {connectionError && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              {connectionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Role and Team Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="role" className="text-sm font-medium">Assign Role</Label>
            <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
              <SelectTrigger className="h-12 border-2 border-border/50 hover:border-primary/30 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="team" className="text-sm font-medium">Assign Team (Optional)</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="h-12 border-2 border-border/50 hover:border-primary/30 transition-colors">
                <SelectValue placeholder="No team assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No team assignment</SelectItem>
                {teamsLoading ? (
                  <SelectItem value="" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading teams...
                    </div>
                  </SelectItem>
                ) : (
                  teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{team.name}</span>
                        {team.description && (
                          <span className="text-xs text-muted-foreground">{team.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expiry and Usage Settings */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="expiryDays" className="text-sm font-medium">Expires in (days)</Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger className="h-12 border-2 border-border/50 hover:border-primary/30 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="maxUses" className="text-sm font-medium">Max uses (optional)</Label>
            <Input
              id="maxUses"
              type="number"
              placeholder="Unlimited"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min="1"
              className="h-12 border-2 border-border/50 hover:border-primary/30 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateCode} 
          disabled={generating}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
        >
          {generating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Enhanced Code...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Generate Enhanced Invite Code
            </div>
          )}
        </Button>

        {/* Generated Code Display */}
        {inviteCode && (
          <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Invite Code Generated Successfully!</span>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Generated Invite Code</Label>
              <div className="flex gap-3">
                <Input
                  value={inviteCode}
                  readOnly
                  className="font-mono bg-white/50 dark:bg-card/50 border-2 text-lg font-bold tracking-wider"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="h-12 w-12 border-2 hover:bg-green-100 dark:hover:bg-green-900/20"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
              <div className="flex items-center gap-2">
                <strong>Role:</strong> {roleOptions.find(r => r.value === selectedRole)?.label}
              </div>
              {selectedTeam && teams && (
                <div className="flex items-center gap-2">
                  <strong>Team:</strong> {teams.find(t => t.id === selectedTeam)?.name}
                </div>
              )}
              <div className="flex items-center gap-2">
                <strong>Valid for:</strong> {expiryDays} days{maxUses ? ` with maximum ${maxUses} uses` : ' with unlimited uses'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedInviteCodeGenerator;

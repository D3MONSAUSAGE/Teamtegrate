
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Users, UserPlus } from 'lucide-react';
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

  // Fetch teams for the organization
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['organization-teams', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, description')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
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
        return { success: false, error: 'Failed to generate invite code' };
      }

      return { success: true, inviteCode: data };
    } catch (error) {
      console.error('Error in generateEnhancedInviteCode:', error);
      return { success: false, error: 'Failed to generate invite code' };
    }
  };

  const handleGenerateCode = async () => {
    if (!user?.organizationId) {
      toast.error('Organization not found');
      return;
    }

    setGenerating(true);
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
    return null;
  }

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'user', label: 'User', description: 'Basic user with limited permissions' },
    { value: 'manager', label: 'Manager', description: 'Can manage projects and team members' },
    { value: 'admin', label: 'Admin', description: 'Can manage users and organization settings' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Generate Enhanced Invite Code
        </CardTitle>
        <CardDescription>
          Create invite codes with specific roles and optional team assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">Assign Role</Label>
            <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Assign Team (Optional)</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="No team assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No team assignment</SelectItem>
                {teamsLoading ? (
                  <SelectItem value="" disabled>Loading teams...</SelectItem>
                ) : (
                  teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex flex-col">
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDays">Expires in (days)</Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="maxUses">Max uses (optional)</Label>
            <Input
              id="maxUses"
              type="number"
              placeholder="Unlimited"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min="1"
            />
          </div>
        </div>

        <Button 
          onClick={handleGenerateCode} 
          disabled={generating}
          className="w-full"
        >
          {generating ? 'Generating...' : 'Generate Enhanced Invite Code'}
        </Button>

        {inviteCode && (
          <div className="space-y-2">
            <Label>Generated Invite Code</Label>
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                readOnly
                className="font-mono bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Role:</strong> {roleOptions.find(r => r.value === selectedRole)?.label}
              </p>
              {selectedTeam && teams && (
                <p>
                  <strong>Team:</strong> {teams.find(t => t.id === selectedTeam)?.name}
                </p>
              )}
              <p>
                Valid for {expiryDays} days{maxUses ? ` with maximum ${maxUses} uses` : ''}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedInviteCodeGenerator;

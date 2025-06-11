
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Users } from 'lucide-react';
import { generateInviteCode } from '@/contexts/auth/authOperations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

const InviteCodeGenerator: React.FC = () => {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [expiryDays, setExpiryDays] = useState<string>('7');
  const [maxUses, setMaxUses] = useState<string>('');

  const handleGenerateCode = async () => {
    if (!user?.organizationId) {
      toast.error('Organization not found');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateInviteCode(
        user.organizationId,
        parseInt(expiryDays),
        maxUses ? parseInt(maxUses) : undefined
      );

      if (result.success && result.inviteCode) {
        setInviteCode(result.inviteCode);
        toast.success('Invite code generated successfully!');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Generate Invite Code
        </CardTitle>
        <CardDescription>
          Create invite codes for new team members to join your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          {generating ? 'Generating...' : 'Generate Invite Code'}
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
            <p className="text-sm text-muted-foreground">
              Share this code with new team members to invite them to your organization.
              Valid for {expiryDays} days{maxUses ? ` with maximum ${maxUses} uses` : ''}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InviteCodeGenerator;

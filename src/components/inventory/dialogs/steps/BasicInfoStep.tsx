import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamSelect } from '@/components/ui/team-select';
import { Settings } from 'lucide-react';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useAuth } from '@/contexts/AuthContext';
import type { TemplateFormData } from '../EnhancedTemplateDialog';

interface BasicInfoStepProps {
  formData: TemplateFormData;
  updateFormData: (updates: Partial<TemplateFormData>) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  updateFormData
}) => {
  const { user } = useAuth();
  const { teams, isLoading: teamsLoading } = useTeamsByOrganization(user?.organizationId);

  // Check if user can create templates for all teams
  const canCreateForAllTeams = user?.role && ['admin', 'superadmin', 'manager'].includes(user.role);

  // Transform teams for TeamSelect component
  const teamsForSelect = teams.map(team => ({
    id: team.id,
    name: team.name,
    description: team.description
  }));
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Template Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                placeholder="e.g., Daily Store Count"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team-assignment">Team Assignment</Label>
              <TeamSelect
                teams={teamsForSelect}
                isLoading={teamsLoading}
                selectedTeam={formData.team_id}
                onTeamChange={(teamId) => updateFormData({ team_id: teamId })}
                optional={canCreateForAllTeams}
                disabled={false}
              />
              {formData.team_id === null && canCreateForAllTeams && (
                <p className="text-sm text-muted-foreground">
                  This template will be available to all teams in your organization.
                </p>
              )}
              {formData.team_id && (
                <p className="text-sm text-muted-foreground">
                  This template will be available to the selected team only.
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this template and when to use it..."
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                updateFormData({ priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Template Setup</h4>
              <p className="text-sm text-muted-foreground">
                Give your template a clear, descriptive name and assign it to a specific team or make it available to all teams. 
                This will help your organization find and use the right template for their inventory counts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
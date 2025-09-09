import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EscalationLevel {
  level: number;
  roles: UserRole[];
  timeout_hours: number;
}

interface AssignmentRuleEditorProps {
  rule?: any;
  requestTypeId: string;
  open: boolean;
  onClose: () => void;
  onSave: (ruleData: any) => void;
}

const ROLES: UserRole[] = ['user', 'team_leader', 'manager', 'admin', 'superadmin'];

export const AssignmentRuleEditor: React.FC<AssignmentRuleEditorProps> = ({
  rule,
  requestTypeId,
  open,
  onClose,
  onSave
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'role_based',
    assignment_strategy: 'first_available',
    is_active: true,
    conditions: {
      roles: [] as UserRole[],
      job_roles: [] as string[],
      team_ids: [] as string[],
      custom_logic: ''
    },
    escalation_rules: {
      timeout_hours: 48,
      escalation_levels: [] as EscalationLevel[]
    }
  });

  // Fetch job roles
  const { data: jobRoles } = useQuery({
    queryKey: ['jobRoles', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      const { data, error } = await supabase
        .from('job_roles')
        .select('id, name')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        rule_name: rule.rule_name || '',
        rule_type: rule.rule_type || 'role_based',
        assignment_strategy: rule.assignment_strategy || 'first_available',
        is_active: rule.is_active ?? true,
        conditions: {
          roles: rule.conditions?.roles || [],
          job_roles: rule.conditions?.job_roles || [],
          team_ids: rule.conditions?.team_ids || [],
          custom_logic: rule.conditions?.custom_logic || ''
        },
        escalation_rules: {
          timeout_hours: rule.escalation_rules?.timeout_hours || 48,
          escalation_levels: rule.escalation_rules?.escalation_levels || []
        }
      });
    }
  }, [rule]);

  const handleSave = () => {
    if (!formData.rule_name.trim()) {
      return;
    }

    onSave(formData);
  };

  const handleRoleToggle = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        roles: prev.conditions.roles.includes(role)
          ? prev.conditions.roles.filter(r => r !== role)
          : [...prev.conditions.roles, role]
      }
    }));
  };

  const handleJobRoleToggle = (jobRoleId: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        job_roles: prev.conditions.job_roles.includes(jobRoleId)
          ? prev.conditions.job_roles.filter(jr => jr !== jobRoleId)
          : [...prev.conditions.job_roles, jobRoleId]
      }
    }));
  };

  const handleTeamToggle = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        team_ids: prev.conditions.team_ids.includes(teamId)
          ? prev.conditions.team_ids.filter(t => t !== teamId)
          : [...prev.conditions.team_ids, teamId]
      }
    }));
  };

  const addEscalationLevel = () => {
    setFormData(prev => ({
      ...prev,
      escalation_rules: {
        ...prev.escalation_rules,
        escalation_levels: [
          ...prev.escalation_rules.escalation_levels,
          {
            level: prev.escalation_rules.escalation_levels.length + 1,
            roles: [],
            timeout_hours: 24
          }
        ]
      }
    }));
  };

  const removeEscalationLevel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      escalation_rules: {
        ...prev.escalation_rules,
        escalation_levels: prev.escalation_rules.escalation_levels.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Assignment Rule' : 'Create Assignment Rule'}
          </DialogTitle>
          <DialogDescription>
            Configure how requests should be automatically assigned to approvers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rule_name">Rule Name</Label>
                <Input
                  id="rule_name"
                  value={formData.rule_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                  placeholder="e.g., Urgent Requests to Admins"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, rule_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role_based">Role Based</SelectItem>
                      <SelectItem value="job_role_based">Job Role Based</SelectItem>
                      <SelectItem value="team_hierarchy">Team Hierarchy</SelectItem>
                      <SelectItem value="custom">Custom Logic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignment_strategy">Assignment Strategy</Label>
                  <Select
                    value={formData.assignment_strategy}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignment_strategy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_available">First Available</SelectItem>
                      <SelectItem value="load_balanced">Load Balanced</SelectItem>
                      <SelectItem value="expertise_based">Expertise Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Conditions</CardTitle>
              <CardDescription>
                Define who can be assigned based on the rule type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.rule_type === 'role_based' && (
                <div>
                  <Label>User Roles</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ROLES.map(role => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={formData.conditions.roles.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <Label htmlFor={`role-${role}`} className="capitalize">
                          {role.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.rule_type === 'job_role_based' && (
                <div>
                  <Label>Job Roles</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {jobRoles?.map(jobRole => (
                      <div key={jobRole.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`job-role-${jobRole.id}`}
                          checked={formData.conditions.job_roles.includes(jobRole.id)}
                          onCheckedChange={() => handleJobRoleToggle(jobRole.id)}
                        />
                        <Label htmlFor={`job-role-${jobRole.id}`}>
                          {jobRole.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.rule_type === 'team_hierarchy' && (
                <div>
                  <Label>Teams</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {teams?.map(team => (
                      <div key={team.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`team-${team.id}`}
                          checked={formData.conditions.team_ids.includes(team.id)}
                          onCheckedChange={() => handleTeamToggle(team.id)}
                        />
                        <Label htmlFor={`team-${team.id}`}>
                          {team.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.rule_type === 'custom' && (
                <div>
                  <Label htmlFor="custom_logic">Custom Logic</Label>
                  <Textarea
                    id="custom_logic"
                    value={formData.conditions.custom_logic}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, custom_logic: e.target.value }
                    }))}
                    placeholder="e.g., priority === 'urgent' || form_data.amount > 1000"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use simple JavaScript-like conditions to match requests
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escalation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Escalation Rules</CardTitle>
              <CardDescription>
                Configure automatic escalation when requests are not handled in time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timeout_hours">Initial Timeout (hours)</Label>
                <Input
                  id="timeout_hours"
                  type="number"
                  value={formData.escalation_rules.timeout_hours}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    escalation_rules: {
                      ...prev.escalation_rules,
                      timeout_hours: parseInt(e.target.value) || 48
                    }
                  }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Escalation Levels</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEscalationLevel}>
                    Add Level
                  </Button>
                </div>
                {formData.escalation_rules.escalation_levels.map((level, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Level {level.level}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEscalationLevel(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Timeout (hours)</Label>
                        <Input
                          type="number"
                          value={level.timeout_hours}
                          onChange={(e) => {
                            const newLevels = [...formData.escalation_rules.escalation_levels];
                            newLevels[index].timeout_hours = parseInt(e.target.value) || 24;
                            setFormData(prev => ({
                              ...prev,
                              escalation_rules: {
                                ...prev.escalation_rules,
                                escalation_levels: newLevels
                              }
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>Escalate to Roles</Label>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {ROLES.map(role => (
                            <div key={role} className="flex items-center space-x-1">
                              <Checkbox
                                id={`escalation-${index}-${role}`}
                                checked={level.roles.includes(role)}
                                onCheckedChange={(checked) => {
                                  const newLevels = [...formData.escalation_rules.escalation_levels];
                                  if (checked) {
                                    newLevels[index].roles = [...level.roles, role];
                                  } else {
                                    newLevels[index].roles = level.roles.filter(r => r !== role);
                                  }
                                  setFormData(prev => ({
                                    ...prev,
                                    escalation_rules: {
                                      ...prev.escalation_rules,
                                      escalation_levels: newLevels
                                    }
                                  }));
                                }}
                              />
                              <Label htmlFor={`escalation-${index}-${role}`} className="text-xs capitalize">
                                {role.replace('_', ' ')}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
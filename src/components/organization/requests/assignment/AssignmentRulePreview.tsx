import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, Zap, Target } from 'lucide-react';

interface AssignmentRulePreviewProps {
  rule: any;
  open: boolean;
  onClose: () => void;
}

export const AssignmentRulePreview: React.FC<AssignmentRulePreviewProps> = ({
  rule,
  open,
  onClose
}) => {
  const getRuleTypeDescription = (type: string) => {
    switch (type) {
      case 'role_based': return 'Assigns based on user roles in the organization';
      case 'job_role_based': return 'Assigns based on specific job roles and responsibilities';
      case 'team_hierarchy': return 'Assigns based on team membership and hierarchy';
      case 'custom': return 'Uses custom logic to determine assignment';
      default: return 'Unknown rule type';
    }
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'first_available': return 'Assigns to the first matching user found';
      case 'load_balanced': return 'Distributes assignments evenly among eligible users';
      case 'expertise_based': return 'Assigns based on user expertise and role priority';
      default: return 'Unknown assignment strategy';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>{rule.rule_name}</span>
          </DialogTitle>
          <DialogDescription>
            Preview of assignment rule configuration and behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                {rule.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">
                Priority: {rule.priority_order + 1}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Rule Type: {rule.rule_type.replace('_', ' ')}
            </div>
          </div>

          {/* Rule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Assignment Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Rule Type</h4>
                <p className="text-sm text-muted-foreground">
                  {getRuleTypeDescription(rule.rule_type)}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Assignment Strategy</h4>
                <p className="text-sm text-muted-foreground">
                  {getStrategyDescription(rule.assignment_strategy)}
                </p>
              </div>

              {/* Conditions */}
              <div>
                <h4 className="font-medium mb-2">Conditions</h4>
                <div className="space-y-2">
                  {rule.conditions.roles && rule.conditions.roles.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Eligible Roles: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.conditions.roles.map((role: string) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {rule.conditions.job_roles && rule.conditions.job_roles.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Job Roles: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.conditions.job_roles.map((jobRole: string) => (
                          <Badge key={jobRole} variant="outline" className="text-xs">
                            {jobRole}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {rule.conditions.team_ids && rule.conditions.team_ids.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Teams: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.conditions.team_ids.map((teamId: string) => (
                          <Badge key={teamId} variant="outline" className="text-xs">
                            Team {teamId.slice(0, 8)}...
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {rule.conditions.custom_logic && (
                    <div>
                      <span className="text-sm font-medium">Custom Logic: </span>
                      <code className="text-xs bg-muted p-2 rounded block mt-1">
                        {rule.conditions.custom_logic}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Escalation Rules */}
          {(rule.escalation_rules?.timeout_hours || rule.escalation_rules?.escalation_levels?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Escalation Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rule.escalation_rules.timeout_hours && (
                  <div>
                    <span className="text-sm font-medium">Initial Timeout: </span>
                    <Badge variant="outline">
                      {rule.escalation_rules.timeout_hours} hours
                    </Badge>
                  </div>
                )}

                {rule.escalation_rules.escalation_levels && rule.escalation_rules.escalation_levels.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Escalation Levels</h4>
                    <div className="space-y-2">
                      {rule.escalation_rules.escalation_levels.map((level: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Level {level.level}</Badge>
                            <span className="text-sm">
                              After {level.timeout_hours}h → 
                            </span>
                            <div className="flex space-x-1">
                              {level.roles.map((role: string) => (
                                <Badge key={role} variant="secondary" className="text-xs">
                                  {role.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Behavior Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Expected Behavior</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>When a request matches this rule:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>System will find users matching the defined conditions</li>
                  <li>Apply the "{rule.assignment_strategy.replace('_', ' ')}" strategy to select assignee(s)</li>
                  {rule.escalation_rules?.timeout_hours && (
                    <li>Start escalation timer for {rule.escalation_rules.timeout_hours} hours</li>
                  )}
                  {rule.escalation_rules?.escalation_levels?.length > 0 && (
                    <li>Escalate through {rule.escalation_rules.escalation_levels.length} levels if not handled</li>
                  )}
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
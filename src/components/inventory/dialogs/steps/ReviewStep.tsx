import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, Calendar, Clock, Bell, Settings, Users, Building } from 'lucide-react';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useAuth } from '@/contexts/AuthContext';
import type { TemplateFormData } from '../EnhancedTemplateDialog';

interface ReviewStepProps {
  formData: TemplateFormData;
  selectedTeam?: string;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  selectedTeam
}) => {
  const { user } = useAuth();
  const { teams } = useTeamsByOrganization(user?.organizationId);
  
  // Find the selected team name
  const selectedTeamData = formData.team_id 
    ? teams.find(team => team.id === formData.team_id)
    : null;
  const formatSchedule = () => {
    if (formData.execution_frequency === 'manual') {
      return 'Manual execution only';
    }

    let schedule = `${formData.execution_frequency.charAt(0).toUpperCase() + formData.execution_frequency.slice(1)}`;
    
    if (formData.execution_days.length > 0) {
      schedule += ` on ${formData.execution_days.join(', ')}`;
    }
    
    if (formData.execution_time_start && formData.execution_time_due) {
      schedule += ` from ${formData.execution_time_start} to ${formData.execution_time_due}`;
    }
    
    return schedule;
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Template Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{formData.name}</h3>
              {formData.description && (
                <p className="text-muted-foreground">{formData.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {formData.team_id ? (
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  Team: {selectedTeamData?.name || 'Unknown Team'}
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Building className="h-3 w-3 mr-1" />
                  All Teams
                </Badge>
              )}
              <Badge variant={
                formData.priority === 'urgent' ? 'destructive' :
                formData.priority === 'high' ? 'default' :
                formData.priority === 'medium' ? 'secondary' : 'outline'
              }>
                {formData.priority} priority
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items ({formData.selectedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {formData.selectedItems.map((selected, index) => (
              <div key={selected.item.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-8">
                    {index + 1}.
                  </span>
                  <div>
                    <span className="font-medium">{selected.item.name}</span>
                    {selected.item.sku && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {selected.item.sku}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  In Stock: {selected.inStockQuantity} {selected.item.base_unit?.abbreviation || 'units'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Execution</h4>
              <p className="text-sm text-muted-foreground">{formatSchedule()}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Duration</h4>
              <p className="text-sm text-muted-foreground">
                {formData.execution_window_hours} hours to complete
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Notifications</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Remind {formData.notification_settings.remind_before_hours}h before</p>
                {formData.notification_settings.remind_overdue && (
                  <p>Escalate after {formData.notification_settings.escalate_overdue_hours}h overdue</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Message */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-green-800">Ready to Create</h4>
              <p className="text-sm text-green-700 mt-1">
                Your template is configured and ready to be created. Once created, it will be available
                for {formData.team_id ? `the ${selectedTeamData?.name || 'selected'} team` : 'all teams in your organization'} to use for inventory counts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
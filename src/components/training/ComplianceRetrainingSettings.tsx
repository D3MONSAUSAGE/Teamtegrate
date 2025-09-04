import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Clock, AlertCircle, Save, RotateCcw, Calendar, Bell } from 'lucide-react';
import { useComplianceTemplates } from '@/hooks/useComplianceAssignment';
import { useRetrainingNotifications } from '@/hooks/useRetrainingNotifications';
import { toast } from '@/components/ui/sonner';

interface ComplianceRetrainingSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ComplianceRetrainingSettings: React.FC<ComplianceRetrainingSettingsProps> = ({
  open,
  onOpenChange
}) => {
  const { data: templates = [] } = useComplianceTemplates();
  const {
    settings,
    saveRetrainingSettings,
    deleteRetrainingSettings,
    getRetrainingSettingsForCourse,
    loading,
    triggerRetrainingCheck
  } = useRetrainingNotifications();

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [intervalMonths, setIntervalMonths] = useState(12);
  const [warningDays, setWarningDays] = useState(30);
  const [isActive, setIsActive] = useState(true);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const existingSettings = getRetrainingSettingsForCourse(templateId);
    
    if (existingSettings) {
      setIntervalMonths(existingSettings.retraining_interval_months);
      setWarningDays(existingSettings.warning_period_days);
      setIsActive(existingSettings.is_active);
    } else {
      // Reset to defaults
      setIntervalMonths(12);
      setWarningDays(30);
      setIsActive(true);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a compliance template');
      return;
    }

    if (intervalMonths < 1 || intervalMonths > 120) {
      toast.error('Retraining interval must be between 1 and 120 months');
      return;
    }

    if (warningDays < 1 || warningDays > 365) {
      toast.error('Warning period must be between 1 and 365 days');
      return;
    }

    try {
      await saveRetrainingSettings(selectedTemplate, intervalMonths, warningDays, isActive);
      toast.success('Retraining settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save retraining settings');
    }
  };

  const handleDeleteSettings = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a compliance template');
      return;
    }

    try {
      await deleteRetrainingSettings(selectedTemplate);
      toast.success('Retraining settings deleted successfully');
      
      // Reset form
      setIntervalMonths(12);
      setWarningDays(30);
      setIsActive(true);
    } catch (error) {
      console.error('Error deleting settings:', error);
      toast.error('Failed to delete retraining settings');
    }
  };

  const handleTriggerCheck = async () => {
    try {
      await triggerRetrainingCheck();
      toast.success('Retraining check triggered successfully');
    } catch (error) {
      console.error('Error triggering check:', error);
      toast.error('Failed to trigger retraining check');
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  const existingSettings = selectedTemplate ? getRetrainingSettingsForCourse(selectedTemplate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compliance Retraining Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Compliance Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a compliance template to configure..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          {template.jurisdiction && (
                            <span className="text-xs text-muted-foreground">
                              {template.jurisdiction}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTemplateData && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{selectedTemplateData.name}</h4>
                      <div className="flex gap-2">
                        {selectedTemplateData.jurisdiction && (
                          <Badge variant="outline">{selectedTemplateData.jurisdiction}</Badge>
                        )}
                        {existingSettings && (
                          <Badge variant={existingSettings.is_active ? 'default' : 'secondary'}>
                            {existingSettings.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedTemplateData.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplateData.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <>
              {/* Retraining Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Retraining Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interval">Retraining Interval (months)</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        max="120"
                        value={intervalMonths}
                        onChange={(e) => setIntervalMonths(parseInt(e.target.value) || 12)}
                        placeholder="12"
                      />
                      <p className="text-xs text-muted-foreground">
                        How often users need to retake this training
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warning">Warning Period (days)</Label>
                      <Input
                        id="warning"
                        type="number"
                        min="1"
                        max="365"
                        value={warningDays}
                        onChange={(e) => setWarningDays(parseInt(e.target.value) || 30)}
                        placeholder="30"
                      />
                      <p className="text-xs text-muted-foreground">
                        Days before expiry to send warnings
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Active Retraining</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable automatic retraining assignments for this template
                      </p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  {existingSettings && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Current Settings</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Interval:</span>
                          <p className="font-medium">{existingSettings.retraining_interval_months} months</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Warning:</span>
                          <p className="font-medium">{existingSettings.warning_period_days} days</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium">
                            {existingSettings.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {existingSettings && (
                    <Button
                      variant="outline"
                      onClick={handleDeleteSettings}
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Default
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Manual Trigger Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Manual Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Trigger Retraining Check</Label>
                    <p className="text-sm text-muted-foreground">
                      Manually check for users who need retraining assignments
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTriggerCheck}
                    disabled={loading}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Check Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Overview */}
          {settings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Retraining Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {settings.map((setting) => {
                    const template = templates.find(t => t.id === setting.course_id);
                    return (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{template?.name || 'Unknown Template'}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Interval: {setting.retraining_interval_months}mo</span>
                            <span>Warning: {setting.warning_period_days}d</span>
                          </div>
                        </div>
                        <Badge variant={setting.is_active ? 'default' : 'secondary'}>
                          {setting.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceRetrainingSettings;
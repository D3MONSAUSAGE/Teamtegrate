import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFeedbackCheckpointManagement } from '@/hooks/onboarding/useOnboardingFeedback';
import { useOnboardingInstances } from '@/hooks/onboarding/useOnboardingInstances';

interface CreateFeedbackCheckpointProps {
  onSuccess?: () => void;
  preselectedInstanceId?: string;
}

export const CreateFeedbackCheckpoint: React.FC<CreateFeedbackCheckpointProps> = ({
  onSuccess,
  preselectedInstanceId,
}) => {
  const [selectedInstanceId, setSelectedInstanceId] = useState(preselectedInstanceId || '');
  const [daysOffset, setDaysOffset] = useState<number>(30);
  const [checkpointLabel, setCheckpointLabel] = useState('');

  const { instances } = useOnboardingInstances();
  const { createCheckpoint, isCreating } = useFeedbackCheckpointManagement();

  // Filter for active instances only
  const activeInstances = instances?.filter(instance => instance.status === 'active') || [];

  const selectedInstance = activeInstances.find(instance => instance.id === selectedInstanceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInstance) return;

    await createCheckpoint.mutateAsync({
      instance_id: selectedInstance.id,
      employee_id: selectedInstance.employee_id,
      days_offset: daysOffset,
      checkpoint_label: checkpointLabel.trim() || undefined,
    });

    onSuccess?.();
  };

  const commonDaysOptions = [
    { value: 7, label: '1 Week Check-in' },
    { value: 14, label: '2 Week Check-in' },
    { value: 30, label: '30-Day Check-in' },
    { value: 60, label: '60-Day Check-in' },
    { value: 90, label: '90-Day Check-in' },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Schedule Feedback Checkpoint</DialogTitle>
        <DialogDescription>
          Create a feedback checkpoint for an active onboarding instance.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!preselectedInstanceId && (
          <div className="space-y-2">
            <Label htmlFor="instance">Onboarding Instance *</Label>
            <Select 
              value={selectedInstanceId} 
              onValueChange={setSelectedInstanceId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an active onboarding instance" />
              </SelectTrigger>
              <SelectContent>
                {activeInstances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.employee?.name || 'Unknown Employee'} - {instance.template?.name || 'No Template'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeInstances.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active onboarding instances found.
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="daysOffset">Days from Start Date *</Label>
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {commonDaysOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={daysOffset === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDaysOffset(option.value);
                    if (!checkpointLabel) {
                      setCheckpointLabel(option.label);
                    }
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <Input
              id="daysOffset"
              type="number"
              min="1"
              max="365"
              value={daysOffset}
              onChange={(e) => setDaysOffset(parseInt(e.target.value) || 1)}
              placeholder="Enter custom number of days"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkpointLabel">Checkpoint Label (Optional)</Label>
          <Input
            id="checkpointLabel"
            value={checkpointLabel}
            onChange={(e) => setCheckpointLabel(e.target.value)}
            placeholder="e.g., '30-Day Check-in', 'First Month Review'"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            If not provided, will default to "{daysOffset}-Day Check-in"
          </p>
        </div>

        {selectedInstance && (
          <div className="p-3 bg-muted rounded-md">
            <h4 className="text-sm font-medium mb-2">Preview</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Employee:</strong> {selectedInstance.employee?.name}</p>
              <p><strong>Template:</strong> {selectedInstance.template?.name || 'No Template'}</p>
              <p><strong>Start Date:</strong> {selectedInstance.start_date}</p>
              <p><strong>Checkpoint:</strong> {checkpointLabel || `${daysOffset}-Day Check-in`}</p>
              <p>
                <strong>Due Date:</strong> {
                  new Date(new Date(selectedInstance.start_date).getTime() + daysOffset * 24 * 60 * 60 * 1000)
                    .toLocaleDateString()
                }
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={!selectedInstanceId || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Checkpoint'}
          </Button>
        </div>
      </form>
    </>
  );
};
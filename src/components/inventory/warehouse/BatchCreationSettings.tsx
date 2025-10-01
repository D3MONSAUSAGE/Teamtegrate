import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Settings, Factory } from 'lucide-react';

interface BatchCreationSettingsProps {
  autoCreateBatches: boolean;
  onAutoCreateChange: (enabled: boolean) => void;
  batchThreshold: number;
  onThresholdChange: (threshold: number) => void;
}

export const BatchCreationSettings: React.FC<BatchCreationSettingsProps> = ({
  autoCreateBatches,
  onAutoCreateChange,
  batchThreshold,
  onThresholdChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-primary" />
          <CardTitle>Auto-Batch Creation Settings</CardTitle>
        </div>
        <CardDescription>
          Configure automatic manufacturing batch creation for production workflows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-batches" className="text-base">
              Enable Auto-Batch Creation
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically create manufacturing batches when production is received
            </p>
          </div>
          <Switch
            id="auto-batches"
            checked={autoCreateBatches}
            onCheckedChange={onAutoCreateChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold">
            Minimum Quantity Threshold
          </Label>
          <Input
            id="threshold"
            type="number"
            value={batchThreshold}
            onChange={(e) => onThresholdChange(parseInt(e.target.value) || 1)}
            min={1}
            disabled={!autoCreateBatches}
          />
          <p className="text-xs text-muted-foreground">
            Only create batches when production quantity meets or exceeds this threshold
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border">
          <h4 className="text-sm font-medium mb-2">How Auto-Batch Works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Production receives trigger batch creation automatically</li>
            <li>• Batch numbers are auto-generated with timestamps</li>
            <li>• Shift and production line are auto-assigned</li>
            <li>• Complete traceability from receipt to distribution</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

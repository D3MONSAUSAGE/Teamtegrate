
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChecklistFrequency } from '@/types/checklist';
import { Button } from '@/components/ui/button';

interface ChecklistBasicInfoProps {
  title: string;
  description: string;
  isTemplate: boolean;
  frequency: ChecklistFrequency;
  onChangeTitle: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onChangeIsTemplate: (v: boolean) => void;
  onChangeFrequency: (v: ChecklistFrequency) => void;
  onContinue: () => void;
}

const ChecklistBasicInfo: React.FC<ChecklistBasicInfoProps> = ({
  title,
  description,
  isTemplate,
  frequency,
  onChangeTitle,
  onChangeDescription,
  onChangeIsTemplate,
  onChangeFrequency,
  onContinue,
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="title">Title</Label>
      <Input 
        id="title" 
        value={title} 
        onChange={e => onChangeTitle(e.target.value)}
        placeholder="E.g., Store Opening Procedure"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="description">Description (optional)</Label>
      <Textarea
        id="description"
        value={description}
        onChange={e => onChangeDescription(e.target.value)}
        placeholder="Describe the purpose of this checklist"
        rows={3}
      />
    </div>
    <div className="flex items-center space-x-2">
      <Switch
        id="template"
        checked={isTemplate}
        onCheckedChange={onChangeIsTemplate}
      />
      <Label htmlFor="template">Save as reusable template</Label>
    </div>
    {isTemplate && (
      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select
          value={frequency}
          onValueChange={v => onChangeFrequency(v as ChecklistFrequency)}
        >
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">One Time</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}
    <div className="pt-2">
      <Button type="button" onClick={onContinue}>
        Continue to Items
      </Button>
    </div>
  </div>
);

export default ChecklistBasicInfo;

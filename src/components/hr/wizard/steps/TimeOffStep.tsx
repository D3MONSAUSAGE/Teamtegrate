import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmployeeFormData, DEFAULT_TIME_OFF_ALLOCATIONS } from '@/types/employee';
import { Clock } from 'lucide-react';

interface TimeOffStepProps {
  formData: EmployeeFormData;
  onChange: (data: Partial<EmployeeFormData>) => void;
}

const TimeOffStep: React.FC<TimeOffStepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Time Off Allocation</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set the employee's annual time off allowances. These can be adjusted later.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vacation_hours_annual">
            Vacation Hours per Year <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2 items-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              id="vacation_hours_annual"
              type="number"
              min="0"
              step="8"
              value={formData.vacation_hours_annual}
              onChange={(e) =>
                onChange({ vacation_hours_annual: parseInt(e.target.value) || 0 })
              }
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Default: {DEFAULT_TIME_OFF_ALLOCATIONS.vacation} hours (2 weeks)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sick_hours_annual">
            Sick Leave Hours per Year <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2 items-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              id="sick_hours_annual"
              type="number"
              min="0"
              step="8"
              value={formData.sick_hours_annual}
              onChange={(e) => onChange({ sick_hours_annual: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Default: {DEFAULT_TIME_OFF_ALLOCATIONS.sick} hours (5 days)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="personal_hours_annual">
            Personal Days per Year <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2 items-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              id="personal_hours_annual"
              type="number"
              min="0"
              step="8"
              value={formData.personal_hours_annual}
              onChange={(e) =>
                onChange({ personal_hours_annual: parseInt(e.target.value) || 0 })
              }
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Default: {DEFAULT_TIME_OFF_ALLOCATIONS.personal} hours (2 days)
          </p>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Time Off Summary</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total Annual Vacation:</span>
            <span className="font-mono">
              {formData.vacation_hours_annual} hours (
              {Math.floor(formData.vacation_hours_annual / 8)} days)
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Annual Sick Leave:</span>
            <span className="font-mono">
              {formData.sick_hours_annual} hours ({Math.floor(formData.sick_hours_annual / 8)}{' '}
              days)
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Annual Personal:</span>
            <span className="font-mono">
              {formData.personal_hours_annual} hours (
              {Math.floor(formData.personal_hours_annual / 8)} days)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeOffStep;

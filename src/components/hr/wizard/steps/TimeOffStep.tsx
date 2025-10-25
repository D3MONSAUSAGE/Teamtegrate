import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmployeeFormData, DEFAULT_TIME_OFF_ALLOCATIONS, CALIFORNIA_SICK_LEAVE } from '@/types/employee';
import { Clock, Shield } from 'lucide-react';

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

      {/* California Compliance Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">California Sick Leave Compliance</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Sick leave is configured to meet California state law requirements:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside ml-2">
              <li>40 hours frontloaded annually (employees can accrue up to 80 hours total)</li>
              <li>90-day waiting period before employee can use sick leave (starts on hire date)</li>
              <li>Unused hours carry over to next year (maximum 40 hours carryover)</li>
              <li>Prorated for mid-year hires (minimum 24 hours guaranteed)</li>
            </ul>
          </div>
        </div>
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
          <Label htmlFor="sick_hours_annual" className="flex items-center gap-2">
            Sick Leave Hours per Year (California) <span className="text-destructive">*</span>
            <span className="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/30 px-2 py-0.5 rounded">
              CA Compliant
            </span>
          </Label>
          <div className="flex gap-2 items-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              id="sick_hours_annual"
              type="number"
              value={CALIFORNIA_SICK_LEAVE.ANNUAL_FRONTLOAD}
              disabled
              className="bg-muted"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            California requirement: {CALIFORNIA_SICK_LEAVE.ANNUAL_FRONTLOAD} hours/year (frontload method)
            <br />
            Cap: {CALIFORNIA_SICK_LEAVE.MAX_BALANCE_CAP} hours total (40 carryover + 40 new). Will be prorated for mid-year hires.
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

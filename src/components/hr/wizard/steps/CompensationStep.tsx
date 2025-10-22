import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeFormData } from '@/types/employee';

interface CompensationStepProps {
  formData: EmployeeFormData;
  onChange: (data: Partial<EmployeeFormData>) => void;
}

const CompensationStep: React.FC<CompensationStepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Compensation</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set the employee's employment type and pay rate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employment_status">
            Employment Status <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.employment_status}
            onValueChange={(value) => onChange({ employment_status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary_type">
            Salary Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.salary_type}
            onValueChange={(value) => onChange({ salary_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="salary">Salary</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hourly_rate">
          {formData.salary_type === 'hourly' ? 'Hourly Rate' : 'Annual Salary'} ($){' '}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="hourly_rate"
          type="number"
          step="0.01"
          min="0"
          value={formData.hourly_rate}
          onChange={(e) => onChange({ hourly_rate: parseFloat(e.target.value) || 0 })}
          placeholder={formData.salary_type === 'hourly' ? '25.00' : '75000'}
          required
        />
        <p className="text-xs text-muted-foreground">
          {formData.salary_type === 'hourly'
            ? 'Used for payroll calculations and time tracking'
            : 'Annual salary amount before taxes and deductions'}
        </p>
      </div>
    </div>
  );
};

export default CompensationStep;

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmployeeFormData } from '@/types/employee';

interface BasicInfoStepProps {
  formData: EmployeeFormData;
  onChange: (data: Partial<EmployeeFormData>) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the new employee's basic contact and identification information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="john.doe@company.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employee_number">Employee Number</Label>
          <Input
            id="employee_number"
            value={formData.employee_number || ''}
            onChange={(e) => onChange({ employee_number: e.target.value })}
            placeholder="Auto-generated if left blank"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to auto-generate (EMP-{Date.now()})
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ''}
            onChange={(e) => onChange({ date_of_birth: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hire_date">
            Hire Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date || ''}
            onChange={(e) => onChange({ hire_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address || ''}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="123 Main St, City, State 12345"
        />
      </div>
    </div>
  );
};

export default BasicInfoStep;

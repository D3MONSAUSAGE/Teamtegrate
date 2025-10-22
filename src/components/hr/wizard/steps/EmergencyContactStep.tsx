import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmployeeFormData } from '@/types/employee';
import { AlertCircle } from 'lucide-react';

interface EmergencyContactStepProps {
  formData: EmployeeFormData;
  onChange: (data: Partial<EmployeeFormData>) => void;
}

const EmergencyContactStep: React.FC<EmergencyContactStepProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Provide emergency contact information for this employee. This information is kept secure
          and only used in case of emergencies.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
          <Input
            id="emergency_contact_name"
            value={formData.emergency_contact_name || ''}
            onChange={(e) => onChange({ emergency_contact_name: e.target.value })}
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
          <Input
            id="emergency_contact_phone"
            type="tel"
            value={formData.emergency_contact_phone || ''}
            onChange={(e) => onChange({ emergency_contact_phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact_relationship">Relationship to Employee</Label>
          <Input
            id="emergency_contact_relationship"
            value={formData.emergency_contact_relationship || ''}
            onChange={(e) => onChange({ emergency_contact_relationship: e.target.value })}
            placeholder="Spouse, Parent, Sibling, Friend, etc."
          />
        </div>
      </div>

      <div className="flex gap-3 p-4 bg-muted rounded-lg">
        <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Privacy Notice</p>
          <p>
            Emergency contact information is securely stored and only accessible to authorized HR
            personnel and administrators. It will only be used in case of workplace emergencies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactStep;

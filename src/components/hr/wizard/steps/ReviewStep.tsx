import React from 'react';
import { EmployeeFormData } from '@/types/employee';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, DollarSign, Clock, Users, AlertCircle } from 'lucide-react';

interface ReviewStepProps {
  formData: EmployeeFormData;
  teamNames: Record<string, string>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData, teamNames }) => {
  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || 'Not provided'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review & Create</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please review all information before creating the employee record.
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Basic Information</h4>
          <div className="space-y-1">
            <InfoRow icon={User} label="Full Name" value={formData.name} />
            <InfoRow icon={Mail} label="Email" value={formData.email} />
            <InfoRow icon={Phone} label="Phone" value={formData.phone} />
            <InfoRow
              icon={User}
              label="Employee Number"
              value={formData.employee_number || `EMP-${Date.now()}`}
            />
            <InfoRow icon={Calendar} label="Hire Date" value={formData.hire_date} />
            <InfoRow icon={Calendar} label="Date of Birth" value={formData.date_of_birth} />
          </div>
        </div>

        {/* Role & Access */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Role & Access</h4>
          <div className="space-y-1">
            <div className="flex items-start gap-3 py-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">System Role</p>
                <Badge variant="secondary" className="mt-1">
                  {formData.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Team & Department */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Team & Department</h4>
          <div className="space-y-1">
            <InfoRow icon={Users} label="Department" value={formData.department} />
            <div className="flex items-start gap-3 py-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Teams</p>
                {formData.team_assignments.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.team_assignments.map((assignment) => (
                      <Badge key={assignment.team_id} variant="secondary">
                        {teamNames[assignment.team_id] || 'Unknown'} ({assignment.role})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium">No teams assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Compensation</h4>
          <div className="space-y-1">
            <InfoRow
              icon={DollarSign}
              label="Salary Type"
              value={formData.salary_type.charAt(0).toUpperCase() + formData.salary_type.slice(1)}
            />
            <InfoRow
              icon={DollarSign}
              label={formData.salary_type === 'hourly' ? 'Hourly Rate' : 'Annual Salary'}
              value={`$${formData.hourly_rate.toFixed(2)}`}
            />
            <InfoRow
              icon={User}
              label="Employment Status"
              value={formData.employment_status.replace('_', ' ')}
            />
          </div>
        </div>

        {/* Time Off */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Time Off Allocation</h4>
          <div className="space-y-1">
            <InfoRow
              icon={Clock}
              label="Vacation Hours/Year"
              value={`${formData.vacation_hours_annual} hours (${Math.floor(formData.vacation_hours_annual / 8)} days)`}
            />
            <InfoRow
              icon={Clock}
              label="Sick Leave Hours/Year"
              value={`${formData.sick_hours_annual} hours (${Math.floor(formData.sick_hours_annual / 8)} days)`}
            />
            <InfoRow
              icon={Clock}
              label="Personal Days/Year"
              value={`${formData.personal_hours_annual} hours (${Math.floor(formData.personal_hours_annual / 8)} days)`}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        {formData.emergency_contact_name && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Emergency Contact</h4>
            <div className="space-y-1">
              <InfoRow icon={AlertCircle} label="Name" value={formData.emergency_contact_name} />
              <InfoRow icon={Phone} label="Phone" value={formData.emergency_contact_phone} />
              <InfoRow
                icon={User}
                label="Relationship"
                value={formData.emergency_contact_relationship}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewStep;

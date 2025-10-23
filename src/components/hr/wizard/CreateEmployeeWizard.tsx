import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EmployeeFormData, DEFAULT_TIME_OFF_ALLOCATIONS } from '@/types/employee';
import WizardProgress from './WizardProgress';
import WizardNavigation from './WizardNavigation';
import BasicInfoStep from './steps/BasicInfoStep';
import RoleAccessStep from './steps/RoleAccessStep';
import TeamDepartmentStep from './steps/TeamDepartmentStep';
import CompensationStep from './steps/CompensationStep';
import TimeOffStep from './steps/TimeOffStep';
import EmergencyContactStep from './steps/EmergencyContactStep';
import ReviewStep from './steps/ReviewStep';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';

interface CreateEmployeeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const STEPS = [
  'Basic Info',
  'Role & Access',
  'Team & Dept',
  'Compensation',
  'Time Off',
  'Emergency',
  'Review',
];

const CreateEmployeeWizard: React.FC<CreateEmployeeWizardProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { teams } = useTeamsByOrganization(user?.organizationId);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    employee_number: '',
    role: 'user',
    team_assignments: [],
    employment_status: 'active',
    salary_type: 'hourly',
    hourly_rate: 15,
    vacation_hours_annual: DEFAULT_TIME_OFF_ALLOCATIONS.vacation,
    sick_hours_annual: DEFAULT_TIME_OFF_ALLOCATIONS.sick,
    personal_hours_annual: DEFAULT_TIME_OFF_ALLOCATIONS.personal,
  });

  const updateFormData = (updates: Partial<EmployeeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        return !!(formData.name && formData.email && formData.hire_date);
      case 2: // Role & Access
        return !!formData.role; // Password no longer required
      case 3: // Team & Department
        return true; // Optional
      case 4: // Compensation
        return !!(
          formData.employment_status &&
          formData.salary_type &&
          formData.hourly_rate > 0
        );
      case 5: // Time Off
        return true; // All fields have defaults
      case 6: // Emergency Contact
        return true; // Optional
      case 7: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!user?.organizationId) {
      toast.error('Organization ID required');
      return;
    }

    setIsLoading(true);
    try {
      // Generate employee number if not provided
      const employeeNumber = formData.employee_number || `EMP-${Date.now()}`;

      // Create employee record WITHOUT auth account
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert([{
          organization_id: user.organizationId,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          employee_number: employeeNumber,
          hire_date: formData.hire_date,
          start_date: formData.start_date || formData.hire_date,
          date_of_birth: formData.date_of_birth,
          phone: formData.phone,
          address: formData.address,
          department: formData.department,
          employment_status: formData.employment_status,
          salary_type: formData.salary_type,
          hourly_rate: formData.hourly_rate,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship: formData.emergency_contact_relationship,
          is_pending_invite: true, // Mark as pending invitation
        } as any])
        .select()
        .single();

      if (userError) throw userError;
      if (!userRecord) throw new Error('Failed to create employee record');

      const newUserId = userRecord.id;

      // Assign job roles
      if (formData.job_role_ids && formData.job_role_ids.length > 0) {
        const jobRoleInserts = formData.job_role_ids.map((roleId) => ({
          organization_id: user.organizationId,
          user_id: newUserId,
          job_role_id: roleId,
          is_primary: false, // Can be updated later
        }));

        const { error: jobRoleError } = await supabase
          .from('user_job_roles')
          .insert(jobRoleInserts);

        if (jobRoleError) throw jobRoleError;
      }

      // Create team assignments
      if (formData.team_assignments.length > 0) {
        const teamInserts = formData.team_assignments.map((assignment) => ({
          user_id: newUserId,
          team_id: assignment.team_id,
          role: assignment.role,
        }));

        const { error: teamError } = await supabase
          .from('team_memberships')
          .insert(teamInserts);

        if (teamError) throw teamError;
      }

      // Create time off balances
      const currentYear = new Date().getFullYear();
      const timeOffBalances = [
        {
          organization_id: user.organizationId,
          user_id: newUserId,
          leave_type: 'vacation',
          total_hours: formData.vacation_hours_annual,
          used_hours: 0,
          accrual_rate: formData.vacation_hours_annual / 26, // Bi-weekly
          year: currentYear,
        },
        {
          organization_id: user.organizationId,
          user_id: newUserId,
          leave_type: 'sick',
          total_hours: formData.sick_hours_annual,
          used_hours: 0,
          accrual_rate: formData.sick_hours_annual / 26,
          year: currentYear,
        },
        {
          organization_id: user.organizationId,
          user_id: newUserId,
          leave_type: 'personal',
          total_hours: formData.personal_hours_annual,
          used_hours: 0,
          accrual_rate: formData.personal_hours_annual / 26,
          year: currentYear,
        },
      ];

      const { error: timeOffError } = await supabase
        .from('employee_time_off_balances')
        .insert(timeOffBalances);

      if (timeOffError) throw timeOffError;

      toast.success(`Employee ${formData.name} created successfully! Use "Invite Users" to give them platform access.`);
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setCurrentStep(1);
      setFormData({
        name: '',
        email: '',
        employee_number: '',
        role: 'user',
        team_assignments: [],
        employment_status: 'active',
        salary_type: 'hourly',
        hourly_rate: 15,
        vacation_hours_annual: DEFAULT_TIME_OFF_ALLOCATIONS.vacation,
        sick_hours_annual: DEFAULT_TIME_OFF_ALLOCATIONS.sick,
        personal_hours_annual: DEFAULT_TIME_OFF_ALLOCATIONS.personal,
      });
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast.error(error.message || 'Failed to create employee');
    } finally {
      setIsLoading(false);
    }
  };

  const teamNames = teams.reduce((acc, team) => {
    acc[team.id] = team.name;
    return acc;
  }, {} as Record<string, string>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Employee</DialogTitle>
          <DialogDescription>
            Complete the following steps to onboard a new employee
          </DialogDescription>
        </DialogHeader>

        <WizardProgress currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />

        <div className="py-6">
          {currentStep === 1 && <BasicInfoStep formData={formData} onChange={updateFormData} />}
          {currentStep === 2 && <RoleAccessStep formData={formData} onChange={updateFormData} />}
          {currentStep === 3 && (
            <TeamDepartmentStep formData={formData} onChange={updateFormData} />
          )}
          {currentStep === 4 && (
            <CompensationStep formData={formData} onChange={updateFormData} />
          )}
          {currentStep === 5 && <TimeOffStep formData={formData} onChange={updateFormData} />}
          {currentStep === 6 && (
            <EmergencyContactStep formData={formData} onChange={updateFormData} />
          )}
          {currentStep === 7 && <ReviewStep formData={formData} teamNames={teamNames} />}
        </div>

        <WizardNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onBack={handleBack}
          onNext={handleNext}
          onCancel={() => onOpenChange(false)}
          onComplete={handleComplete}
          isLoading={isLoading}
          canProceed={validateStep(currentStep)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmployeeWizard;

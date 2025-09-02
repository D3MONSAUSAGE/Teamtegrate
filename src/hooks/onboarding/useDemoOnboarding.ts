import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { toast } from 'sonner';

export const useDemoOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createDemoOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.organizationId || !user?.id) {
        throw new Error('No user or organization');
      }

      // Create demo job role if it doesn't exist
      const { data: existingRole } = await supabase
        .from('job_roles')
        .select('id')
        .eq('organization_id', user.organizationId)
        .eq('name', 'Demo Employee')
        .single();

      let demoRoleId = existingRole?.id;

      if (!demoRoleId) {
        const { data: newRole, error: roleError } = await supabase
          .from('job_roles')
          .insert({
            name: 'Demo Employee',
            description: 'Demo job role for onboarding demonstration',
            organization_id: user.organizationId,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (roleError) throw roleError;
        demoRoleId = newRole.id;
      }

      // Create demo template if it doesn't exist
      const { data: existingTemplate } = await supabase
        .from('onboarding_templates')
        .select('id')
        .eq('organization_id', user.organizationId)
        .eq('name', 'Demo Onboarding Template')
        .single();

      let templateId = existingTemplate?.id;

      if (!templateId) {
        const { data: template, error: templateError } = await supabase
          .from('onboarding_templates')
          .insert({
            name: 'Demo Onboarding Template',
            description: 'A comprehensive demo onboarding process',
            organization_id: user.organizationId,
            role_id: demoRoleId,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (templateError) throw templateError;
        templateId = template.id;

        // Create demo stages and tasks
        const { data: stage1, error: stage1Error } = await supabase
          .from('onboarding_stages')
          .insert({
            template_id: templateId,
            title: 'Getting Started',
            description: 'Essential first steps for new employees',
            order_index: 1,
            organization_id: user.organizationId,
          })
          .select('id')
          .single();

        if (stage1Error) throw stage1Error;

        const { data: stage2, error: stage2Error } = await supabase
          .from('onboarding_stages')
          .insert({
            template_id: templateId,
            title: 'Training & Development',
            description: 'Complete required training modules',
            order_index: 2,
            organization_id: user.organizationId,
          })
          .select('id')
          .single();

        if (stage2Error) throw stage2Error;

        // Create demo tasks
        const demoTasks = [
          {
            template_id: templateId,
            organization_id: user.organizationId,
            title: 'Complete Profile Setup',
            description: 'Fill out your employee profile and emergency contacts',
            category: 'hr_documentation' as const,
            owner_type: 'employee' as const,
            due_offset_days: 1,
            order_index: 1,
          },
          {
            template_id: templateId,
            organization_id: user.organizationId,
            title: 'Review Employee Handbook',
            description: 'Read through the company policies and procedures',
            category: 'hr_documentation' as const,
            owner_type: 'employee' as const,
            due_offset_days: 3,
            order_index: 2,
          },
          {
            template_id: templateId,
            organization_id: user.organizationId,
            title: 'Meet with Direct Manager',
            description: 'Schedule and complete your first one-on-one meeting',
            category: 'culture_engagement' as const,
            owner_type: 'manager' as const,
            due_offset_days: 2,
            order_index: 3,
          },
          {
            template_id: templateId,
            organization_id: user.organizationId,
            title: 'Complete Compliance Training',
            description: 'Finish all required compliance and safety training modules',
            category: 'compliance_training' as const,
            owner_type: 'employee' as const,
            due_offset_days: 5,
            order_index: 4,
          },
          {
            template_id: templateId,
            organization_id: user.organizationId,
            title: 'Job-Specific Training',
            description: 'Complete role-specific training materials and assessments',
            category: 'job_specific_training' as const,
            owner_type: 'employee' as const,
            due_offset_days: 7,
            order_index: 5,
          },
        ];

        const { error: tasksError } = await supabase
          .from('onboarding_tasks')
          .insert(demoTasks);

        if (tasksError) throw tasksError;
      }

      // Create onboarding instance for current user
      const { data: instance, error: instanceError } = await supabase
        .from('onboarding_instances')
        .insert({
          employee_id: user.id,
          template_id: templateId,
          organization_id: user.organizationId,
          created_by: user.id,
          start_date: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (instanceError) throw instanceError;

      return instance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-instances'] });
      queryClient.invalidateQueries({ queryKey: ['my-onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['job-roles'] });
      toast.success('Demo onboarding created successfully!');
    },
    onError: (error) => {
      console.error('Error creating demo onboarding:', error);
      toast.error('Failed to create demo onboarding');
    },
  });

  return {
    createDemo: createDemoOnboarding.mutate,
    isCreating: createDemoOnboarding.isPending,
  };
};
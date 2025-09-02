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

        // Create comprehensive demo stages
        const stages = [
          {
            template_id: templateId,
            title: 'Week 1: Welcome & Setup',
            description: 'Get oriented and complete essential setup tasks',
            order_index: 1,
            organization_id: user.organizationId,
          },
          {
            template_id: templateId,
            title: 'Week 2: Core Training',
            description: 'Complete fundamental training modules and assessments',
            order_index: 2,
            organization_id: user.organizationId,
          },
          {
            template_id: templateId,
            title: 'Week 3: Role Integration',
            description: 'Job-specific training and team integration',
            order_index: 3,
            organization_id: user.organizationId,
          },
          {
            template_id: templateId,
            title: 'Week 4: Final Steps',
            description: 'Complete certification and feedback sessions',
            order_index: 4,
            organization_id: user.organizationId,
          }
        ];

        const { data: createdStages, error: stagesError } = await supabase
          .from('onboarding_stages')
          .insert(stages)
          .select('id, order_index');

        if (stagesError) throw stagesError;

        // Create comprehensive demo steps for each stage
        const allSteps = [];

        // Week 1 Steps
        const week1Steps = [
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 1)?.id,
            organization_id: user.organizationId,
            title: 'Complete Digital Profile',
            description: 'Set up your employee profile with photo, contact details, and emergency contacts',
            step_type: 'document',
            order_index: 1,
            is_required: true,
            estimated_duration_minutes: 15,
            due_offset_days: 1,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 1)?.id,
            organization_id: user.organizationId,
            title: 'Watch Welcome Video',
            description: 'Watch our company welcome video to learn about our culture and values',
            step_type: 'video',
            order_index: 2,
            is_required: true,
            estimated_duration_minutes: 10,
            due_offset_days: 1,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 1)?.id,
            organization_id: user.organizationId,
            title: 'Review Employee Handbook',
            description: 'Read through company policies, procedures, and code of conduct',
            step_type: 'document',
            order_index: 3,
            is_required: true,
            estimated_duration_minutes: 45,
            due_offset_days: 3,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 1)?.id,
            organization_id: user.organizationId,
            title: 'Meet Your Manager',
            description: 'Schedule and complete your initial one-on-one meeting with your direct manager',
            step_type: 'meeting',
            order_index: 4,
            is_required: true,
            estimated_duration_minutes: 60,
            due_offset_days: 2,
            prerequisites: [],
          }
        ];

        // Week 2 Steps
        const week2Steps = [
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 2)?.id,
            organization_id: user.organizationId,
            title: 'Complete Safety Training Course',
            description: 'Take the mandatory workplace safety training course and pass the assessment',
            step_type: 'course',
            order_index: 1,
            is_required: true,
            estimated_duration_minutes: 90,
            due_offset_days: 7,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 2)?.id,
            organization_id: user.organizationId,
            title: 'Diversity & Inclusion Training',
            description: 'Complete our comprehensive D&I training module',
            step_type: 'course',
            order_index: 2,
            is_required: true,
            estimated_duration_minutes: 60,
            due_offset_days: 10,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 2)?.id,
            organization_id: user.organizationId,
            title: 'Knowledge Check Quiz',
            description: 'Take a quiz covering company policies and safety procedures',
            step_type: 'quiz',
            order_index: 3,
            is_required: true,
            estimated_duration_minutes: 20,
            due_offset_days: 12,
            prerequisites: [],
          }
        ];

        // Week 3 Steps
        const week3Steps = [
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 3)?.id,
            organization_id: user.organizationId,
            title: 'Role-Specific Training',
            description: 'Complete training modules specific to your job role and responsibilities',
            step_type: 'course',
            order_index: 1,
            is_required: true,
            estimated_duration_minutes: 120,
            due_offset_days: 14,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 3)?.id,
            organization_id: user.organizationId,
            title: 'Team Introduction Sessions',
            description: 'Meet with key team members and understand your role within the team',
            step_type: 'meeting',
            order_index: 2,
            is_required: true,
            estimated_duration_minutes: 90,
            due_offset_days: 16,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 3)?.id,
            organization_id: user.organizationId,
            title: 'Submit Required Documents',
            description: 'Upload necessary documentation including certifications and references',
            step_type: 'document',
            order_index: 3,
            is_required: true,
            estimated_duration_minutes: 30,
            due_offset_days: 18,
            prerequisites: [],
          }
        ];

        // Week 4 Steps
        const week4Steps = [
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 4)?.id,
            organization_id: user.organizationId,
            title: 'Final Assessment',
            description: 'Complete the comprehensive onboarding assessment covering all training modules',
            step_type: 'quiz',
            order_index: 1,
            is_required: true,
            estimated_duration_minutes: 45,
            due_offset_days: 21,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 4)?.id,
            organization_id: user.organizationId,
            title: '30-Day Check-in Meeting',
            description: 'Meet with HR and your manager for a comprehensive progress review',
            step_type: 'meeting',
            order_index: 2,
            is_required: true,
            estimated_duration_minutes: 60,
            due_offset_days: 23,
            prerequisites: [],
          },
          {
            template_id: templateId,
            stage_id: createdStages.find(s => s.order_index === 4)?.id,
            organization_id: user.organizationId,
            title: 'Complete Feedback Survey',
            description: 'Provide feedback on your onboarding experience to help us improve',
            step_type: 'task',
            order_index: 3,
            is_required: false,
            estimated_duration_minutes: 15,
            due_offset_days: 25,
            prerequisites: [],
          }
        ];

        allSteps.push(...week1Steps, ...week2Steps, ...week3Steps, ...week4Steps);

        const { error: stepsError } = await supabase
          .from('onboarding_steps')
          .insert(allSteps);

        if (stepsError) throw stepsError;
      }

      // Create onboarding instance for current user using proper assignment process
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

      // Create step progress records for the instance
      const { data: templateSteps, error: stepsError } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index');

      if (stepsError) throw stepsError;

      if (templateSteps && templateSteps.length > 0) {
        // Create step progress records with proper initial statuses
        const stepProgressRecords = templateSteps.map((step, index) => {
          // First few steps are available, others are locked initially
          const status = index < 2 ? 'available' : 'locked'; // Make first 2 steps available for demo

          return {
            instance_id: instance.id,
            step_id: step.id,
            employee_id: user.id,
            organization_id: user.organizationId,
            status,
          };
        });

        const { error: insertError } = await supabase
          .from('onboarding_instance_step_progress')
          .insert(stepProgressRecords);

        if (insertError) throw insertError;
      }

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
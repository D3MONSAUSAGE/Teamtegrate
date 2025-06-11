
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';

export const createSheltonLawProject = async (userId: string, organizationId: string) => {
  try {
    const projectId = uuidv4();
    const now = new Date();
    const nowISO = now.toISOString();

    // Create the new project
    const { error: projectError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        title: 'Shelton & Law - Copy',
        description: 'Legal case management and documentation project',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        manager_id: userId,
        budget: 50000,
        is_completed: false,
        created_at: nowISO,
        updated_at: nowISO,
        team_members: [userId],
        status: 'In Progress',
        tasks_count: 0,
        tags: ['legal', 'case-management'],
        organization_id: organizationId
      });

    if (projectError) {
      console.error('Error creating project:', projectError);
      toast.error('Failed to create project');
      return null;
    }

    // Define all the tasks from the original Shelton & Law project
    const tasksToCreate = [
      {
        title: 'Client intake and initial consultation',
        description: 'Meet with client to understand case details and gather initial documentation',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-01-15'
      },
      {
        title: 'Legal research on precedent cases',
        description: 'Research similar cases and legal precedents relevant to the client\'s situation',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-01-30'
      },
      {
        title: 'Draft initial case strategy document',
        description: 'Create comprehensive strategy document outlining approach and key arguments',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-02-10'
      },
      {
        title: 'Prepare discovery requests',
        description: 'Draft and file formal discovery requests for relevant documents and information',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-02-20'
      },
      {
        title: 'Review opposing counsel\'s discovery responses',
        description: 'Analyze and evaluate discovery materials provided by opposing party',
        priority: 'Medium',
        status: 'Completed',
        deadline: '2024-03-15'
      },
      {
        title: 'Conduct client deposition preparation',
        description: 'Prepare client for deposition with practice sessions and strategy review',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-03-25'
      },
      {
        title: 'Expert witness identification and retention',
        description: 'Identify and retain qualified expert witnesses for case testimony',
        priority: 'Medium',
        status: 'Completed',
        deadline: '2024-04-05'
      },
      {
        title: 'Motion for summary judgment preparation',
        description: 'Research and draft motion for summary judgment with supporting briefs',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-04-20'
      },
      {
        title: 'Settlement negotiation strategy development',
        description: 'Develop comprehensive settlement negotiation strategy and parameters',
        priority: 'Medium',
        status: 'Completed',
        deadline: '2024-05-01'
      },
      {
        title: 'Pre-trial conference preparation',
        description: 'Prepare all materials and arguments for pre-trial conference with judge',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-05-15'
      },
      {
        title: 'Trial exhibit preparation and organization',
        description: 'Organize and prepare all trial exhibits with proper authentication',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-06-01'
      },
      {
        title: 'Witness preparation and coordination',
        description: 'Prepare all witnesses for trial testimony and coordinate schedules',
        priority: 'High',
        status: 'Completed',
        deadline: '2024-06-10'
      },
      {
        title: 'Final trial brief and argument preparation',
        description: 'Complete final trial brief and prepare opening/closing arguments',
        priority: 'High',
        status: 'To Do',
        deadline: '2024-07-01'
      },
      {
        title: 'Jury selection strategy and execution',
        description: 'Develop jury selection strategy and participate in voir dire process',
        priority: 'High',
        status: 'To Do',
        deadline: '2024-07-15'
      },
      {
        title: 'Opening statement delivery',
        description: 'Present compelling opening statement to jury outlining case theory',
        priority: 'High',
        status: 'To Do',
        deadline: '2024-07-16'
      },
      {
        title: 'Direct examination of key witnesses',
        description: 'Conduct direct examination of client and key supporting witnesses',
        priority: 'High',
        status: 'To Do',
        deadline: '2024-07-20'
      },
      {
        title: 'Cross-examination of opposing witnesses',
        description: 'Conduct effective cross-examination of opposing party witnesses',
        priority: 'High',
        status: 'To Do',
        deadline: '2024-07-25'
      },
      {
        title: 'Expert witness testimony coordination',
        description: 'Present expert witness testimony and handle cross-examination',
        priority: 'Medium',
        status: 'To Do',
        deadline: '2024-07-30'
      },
      {
        title: 'Closing argument presentation',
        description: 'Deliver persuasive closing argument summarizing case evidence',
        priority: 'High',
        status: 'To Do',
        deadline: '2024-08-05'
      },
      {
        title: 'Post-trial motions preparation',
        description: 'Prepare any necessary post-trial motions based on trial outcome',
        priority: 'Medium',
        status: 'To Do',
        deadline: '2024-08-15'
      },
      {
        title: 'Appeal preparation and filing',
        description: 'Prepare and file appeal if necessary based on trial verdict',
        priority: 'Medium',
        status: 'To Do',
        deadline: '2024-09-01'
      },
      {
        title: 'Client communication and case closure',
        description: 'Final client communication regarding case outcome and next steps',
        priority: 'Medium',
        status: 'To Do',
        deadline: '2024-09-15'
      },
      {
        title: 'Case file organization and archival',
        description: 'Organize and archive all case files and documentation',
        priority: 'Low',
        status: 'To Do',
        deadline: '2024-09-30'
      },
      {
        title: 'Final billing and fee collection',
        description: 'Complete final billing process and collect outstanding fees',
        priority: 'Medium',
        status: 'To Do',
        deadline: '2024-10-15'
      }
    ];

    // Create all tasks
    const taskInserts = tasksToCreate.map(task => ({
      id: uuidv4(),
      project_id: projectId,
      user_id: userId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: new Date(task.deadline).toISOString(),
      created_at: nowISO,
      updated_at: nowISO,
      cost: 0,
      organization_id: organizationId
    }));

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(taskInserts);

    if (tasksError) {
      console.error('Error creating tasks:', tasksError);
      toast.error('Project created but failed to add some tasks');
      return projectId;
    }

    // Update project tasks count
    const { error: updateError } = await supabase
      .from('projects')
      .update({ tasks_count: tasksToCreate.length })
      .eq('id', projectId);

    if (updateError) {
      console.warn('Error updating project task count:', updateError);
    }

    toast.success(`Successfully created "Shelton & Law - Copy" project with ${tasksToCreate.length} tasks!`);
    return projectId;

  } catch (error) {
    console.error('Error in createSheltonLawProject:', error);
    toast.error('Failed to create project');
    return null;
  }
};

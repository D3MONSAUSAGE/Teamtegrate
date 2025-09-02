import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';

interface OnboardingAnalytics {
  overview: {
    totalInstances: number;
    activeInstances: number;
    completedInstances: number;
    averageCompletionDays: number;
    completionRate: number;
  };
  templatePerformance: Array<{
    templateId: string;
    templateName: string;
    totalInstances: number;
    completedInstances: number;
    averageCompletionDays: number;
    completionRate: number;
    averageRating: number;
  }>;
  completionTrends: Array<{
    month: string;
    completed: number;
    started: number;
  }>;
  taskBottlenecks: Array<{
    title: string;
    category: string;
    averageCompletionDays: number;
    completionRate: number;
    stuckCount: number;
  }>;
  feedbackInsights: {
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
    }>;
    commonIssues: Array<{
      issue: string;
      count: number;
    }>;
  };
  cohortAnalysis: Array<{
    cohort: string;
    totalEmployees: number;
    completedCount: number;
    averageDaysToComplete: number;
    retentionRate: number;
  }>;
}

export const useOnboardingAnalytics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding-analytics', user?.organizationId],
    queryFn: async (): Promise<OnboardingAnalytics> => {
      if (!user?.organizationId) throw new Error('No organization');

      // Fetch all instances for the organization
      const { data: instances, error: instancesError } = await supabase
        .from('onboarding_instances')
        .select(`
          id,
          status,
          start_date,
          created_at,
          updated_at,
          template_id,
          onboarding_templates(id, name)
        `)
        .eq('organization_id', user.organizationId);

      if (instancesError) throw instancesError;

      // Fetch tasks for these instances
      const instanceIds = instances?.map(i => i.id) || [];
      const { data: tasks, error: tasksError } = await supabase
        .from('onboarding_instance_tasks')
        .select('*')
        .in('instance_id', instanceIds);

      if (tasksError) throw tasksError;

      // Fetch feedback data
      const { data: feedback, error: feedbackError } = await supabase
        .from('onboarding_feedback_checkpoints')
        .select('*')
        .eq('organization_id', user.organizationId);

      if (feedbackError) throw feedbackError;

      // Calculate analytics
      const totalInstances = instances?.length || 0;
      const activeInstances = instances?.filter(i => i.status === 'active').length || 0;
      const completedInstances = instances?.filter(i => i.status === 'completed').length || 0;
      
      // Calculate average completion days
      const completedInstancesWithDates = instances?.filter(i => 
        i.status === 'completed' && i.start_date && i.updated_at
      ) || [];
      
      const totalCompletionDays = completedInstancesWithDates.reduce((sum, instance) => {
        const startDate = new Date(instance.start_date);
        const endDate = new Date(instance.updated_at);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      
      const averageCompletionDays = completedInstancesWithDates.length > 0 
        ? Math.round(totalCompletionDays / completedInstancesWithDates.length)
        : 0;

      const completionRate = totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;

      // Template performance analysis
      const templatePerformance = Array.from(
        new Set(instances?.map(i => i.template_id).filter(Boolean))
      ).map(templateId => {
        const templateInstances = instances?.filter(i => i.template_id === templateId) || [];
        const templateCompleted = templateInstances.filter(i => i.status === 'completed');
        const templateName = templateInstances[0]?.onboarding_templates?.name || 'Unknown Template';
        
        const templateCompletionDays = templateCompleted.reduce((sum, instance) => {
          if (instance.start_date && instance.updated_at) {
            const startDate = new Date(instance.start_date);
            const endDate = new Date(instance.updated_at);
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }
          return sum;
        }, 0);

        const templateAvgDays = templateCompleted.length > 0 
          ? Math.round(templateCompletionDays / templateCompleted.length)
          : 0;

        const templateFeedback = feedback?.filter(f => 
          instances?.find(i => i.id === f.instance_id)?.template_id === templateId
        ) || [];
        
        const avgRating = templateFeedback.length > 0
          ? templateFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / templateFeedback.length
          : 0;

        return {
          templateId: templateId!,
          templateName,
          totalInstances: templateInstances.length,
          completedInstances: templateCompleted.length,
          averageCompletionDays: templateAvgDays,
          completionRate: templateInstances.length > 0 
            ? (templateCompleted.length / templateInstances.length) * 100 
            : 0,
          averageRating: Math.round(avgRating * 10) / 10,
        };
      });

      // Completion trends (last 6 months)
      const completionTrends = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthCompleted = instances?.filter(instance => {
          if (instance.status !== 'completed' || !instance.updated_at) return false;
          const updatedDate = new Date(instance.updated_at);
          return updatedDate >= monthStart && updatedDate <= monthEnd;
        }).length || 0;

        const monthStarted = instances?.filter(instance => {
          const startDate = new Date(instance.start_date);
          return startDate >= monthStart && startDate <= monthEnd;
        }).length || 0;

        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          completed: monthCompleted,
          started: monthStarted,
        };
      });

      // Task bottlenecks analysis
      const tasksByTitle = new Map<string, any[]>();
      tasks?.forEach(task => {
        const existing = tasksByTitle.get(task.title) || [];
        tasksByTitle.set(task.title, [...existing, task]);
      });

      const taskBottlenecks = Array.from(tasksByTitle.entries()).map(([title, taskGroup]) => {
        const completedTasks = taskGroup.filter(t => t.status === 'completed');
        const completionRate = taskGroup.length > 0 ? (completedTasks.length / taskGroup.length) * 100 : 0;
        
        const avgCompletionDays = completedTasks.reduce((sum, task) => {
          if (task.started_at && task.completed_at) {
            const days = Math.ceil(
              (new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + Math.max(1, days);
          }
          return sum + 1;
        }, 0) / Math.max(1, completedTasks.length);

        const stuckCount = taskGroup.filter(t => 
          t.status === 'in_progress' && t.started_at &&
          (new Date().getTime() - new Date(t.started_at).getTime()) > (7 * 24 * 60 * 60 * 1000)
        ).length;

        return {
          title,
          category: taskGroup[0]?.category || 'general',
          averageCompletionDays: Math.round(avgCompletionDays),
          completionRate: Math.round(completionRate),
          stuckCount,
        };
      }).sort((a, b) => a.completionRate - b.completionRate).slice(0, 10);

      // Feedback insights
      const completedFeedback = feedback?.filter(f => f.status === 'completed' && f.rating) || [];
      const averageRating = completedFeedback.length > 0
        ? completedFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / completedFeedback.length
        : 0;

      const ratingDistribution = Array.from({ length: 5 }, (_, i) => ({
        rating: i + 1,
        count: completedFeedback.filter(f => f.rating === i + 1).length,
      }));

      // Simple common issues extraction from feedback notes
      const commonIssues = [
        { issue: 'Slow response from IT department', count: 0 },
        { issue: 'Unclear documentation', count: 0 },
        { issue: 'Missing access permissions', count: 0 },
        { issue: 'Training schedule conflicts', count: 0 },
        { issue: 'Mentor unavailability', count: 0 },
      ];

      feedback?.forEach(f => {
        if (f.notes) {
          const notes = f.notes.toLowerCase();
          if (notes.includes('it') || notes.includes('system') || notes.includes('access')) {
            commonIssues[0].count++;
          }
          if (notes.includes('unclear') || notes.includes('documentation') || notes.includes('confusing')) {
            commonIssues[1].count++;
          }
          if (notes.includes('permission') || notes.includes('access') || notes.includes('login')) {
            commonIssues[2].count++;
          }
          if (notes.includes('training') || notes.includes('schedule') || notes.includes('time')) {
            commonIssues[3].count++;
          }
          if (notes.includes('mentor') || notes.includes('manager') || notes.includes('support')) {
            commonIssues[4].count++;
          }
        }
      });

      // Cohort analysis (by month)
      const cohortAnalysis = completionTrends.map(trend => ({
        cohort: trend.month,
        totalEmployees: trend.started,
        completedCount: trend.completed,
        averageDaysToComplete: averageCompletionDays,
        retentionRate: trend.started > 0 ? (trend.completed / trend.started) * 100 : 0,
      }));

      return {
        overview: {
          totalInstances,
          activeInstances,
          completedInstances,
          averageCompletionDays,
          completionRate: Math.round(completionRate),
        },
        templatePerformance,
        completionTrends,
        taskBottlenecks,
        feedbackInsights: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalFeedback: completedFeedback.length,
          ratingDistribution,
          commonIssues: commonIssues.filter(issue => issue.count > 0).sort((a, b) => b.count - a.count),
        },
        cohortAnalysis,
      };
    },
    enabled: !!user?.organizationId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
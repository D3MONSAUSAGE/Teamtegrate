import { useMemo } from 'react';
import { Task, Project, TaskComment, User } from '@/types';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'project_start' | 'task_created' | 'task_status_changed' | 'task_completed' | 'status_change' | 'team_change' | 'budget_update' | 'comment' | 'deadline' | 'project_completed';
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'in_progress' | 'upcoming' | 'overdue';
  metadata?: Record<string, any>;
}

interface UseProjectTimelineProps {
  project: Project;
  tasks: Task[];
  teamMembers: User[];
  comments?: TaskComment[];
}

export const useProjectTimeline = ({ project, tasks, teamMembers, comments = [] }: UseProjectTimelineProps) => {
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    const now = new Date();

    // Project start event
    if (project.startDate) {
      const startDate = typeof project.startDate === 'string' ? parseISO(project.startDate) : new Date(project.startDate);
      events.push({
        id: `project-start-${project.id}`,
        date: startDate,
        type: 'project_start',
        title: 'Project Started',
        description: `${project.title} project was initiated`,
        icon: '🚀',
        status: isBefore(startDate, now) ? 'completed' : 'upcoming'
      });
    }

    // All task events (creation, status changes, completion)
    tasks.forEach(task => {
      // Task creation event
      if (task.createdAt) {
        const createdDate = new Date(task.createdAt);
        events.push({
          id: `task-created-${task.id}`,
          date: createdDate,
          type: 'task_created',
          title: 'Task Created',
          description: `"${task.title}" was created${task.priority ? ` with ${task.priority} priority` : ''}`,
          icon: '📋',
          status: 'completed',
          metadata: { 
            taskId: task.id, 
            priority: task.priority,
            assignedTo: task.assignedToNames?.join(', ') || 'Unassigned'
          }
        });
      }

      // Task status change events
      if (task.status === 'In Progress' && task.createdAt) {
        // For now, we'll use a heuristic: if task is in progress and was created more than 1 hour ago
        const createdDate = new Date(task.createdAt);
        const statusChangeDate = new Date(createdDate.getTime() + (1000 * 60 * 60)); // Add 1 hour as estimate
        
        events.push({
          id: `task-status-${task.id}-in-progress`,
          date: statusChangeDate,
          type: 'task_status_changed',
          title: 'Task In Progress',
          description: `"${task.title}" status changed to In Progress`,
          icon: '🔄',
          status: 'in_progress',
          metadata: { 
            taskId: task.id, 
            priority: task.priority,
            fromStatus: 'To Do',
            toStatus: 'In Progress'
          }
        });
      }

      // Task completion events
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        events.push({
          id: `task-completed-${task.id}`,
          date: completedDate,
          type: 'task_completed',
          title: 'Task Completed',
          description: `"${task.title}" was completed${task.assignedToNames?.length ? ` by ${task.assignedToNames[0]}` : ''}`,
          icon: '✅',
          status: 'completed',
          metadata: { 
            taskId: task.id, 
            priority: task.priority,
            assignedTo: task.assignedToNames?.join(', ') || 'Unassigned'
          }
        });
      }
    });

    // Status change events (we'll track current status as an event)
    if (project.status === 'Completed' && project.updatedAt) {
      const updatedDate = typeof project.updatedAt === 'string' ? parseISO(project.updatedAt) : new Date(project.updatedAt);
      events.push({
        id: `project-completed-${project.id}`,
        date: updatedDate,
        type: 'project_completed',
        title: 'Project Completed',
        description: `${project.title} has been marked as completed`,
        icon: '🎯',
        status: 'completed'
      });
    }

    // Budget milestone events
    if (project.budget && project.budgetSpent) {
      const spentPercentage = (project.budgetSpent / project.budget) * 100;
      if (spentPercentage >= 50) {
        // Create a budget milestone at 50% spent
        events.push({
          id: `budget-50-${project.id}`,
          date: project.updatedAt ? (typeof project.updatedAt === 'string' ? parseISO(project.updatedAt) : new Date(project.updatedAt)) : now,
          type: 'budget_update',
          title: 'Budget Milestone',
          description: `50% of project budget has been spent (${spentPercentage.toFixed(1)}%)`,
          icon: '💰',
          status: spentPercentage >= 80 ? 'overdue' : 'completed',
          metadata: { budgetSpent: project.budgetSpent, budget: project.budget }
        });
      }
    }

    // Team changes (current team as baseline)
    if (teamMembers.length > 0) {
      events.push({
        id: `team-established-${project.id}`,
        date: project.createdAt ? (typeof project.createdAt === 'string' ? parseISO(project.createdAt) : new Date(project.createdAt)) : now,
        type: 'team_change',
        title: 'Team Established',
        description: `Project team of ${teamMembers.length} members was formed`,
        icon: '👥',
        status: 'completed',
        metadata: { teamSize: teamMembers.length }
      });
    }

    // Important comments as events
    comments
      .filter(comment => comment.isPinned || comment.category === 'milestone')
      .forEach(comment => {
        events.push({
          id: `comment-${comment.id}`,
          date: new Date(comment.createdAt),
          type: 'comment',
          title: 'Important Update',
          description: comment.text.length > 100 ? comment.text.substring(0, 100) + '...' : comment.text,
          icon: '💬',
          status: 'completed',
          metadata: { commentId: comment.id, userName: comment.userName }
        });
      });

    // Deadline events
    if (project.endDate) {
      const endDate = typeof project.endDate === 'string' ? parseISO(project.endDate) : new Date(project.endDate);
      const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      events.push({
        id: `deadline-${project.id}`,
        date: endDate,
        type: 'deadline',
        title: project.status === 'Completed' ? 'Project Deadline' : 'Deadline Approaching',
        description: project.status === 'Completed' 
          ? `Project deadline was ${format(endDate, 'MMM dd, yyyy')}`
          : daysUntilDeadline > 0 
            ? `Project deadline in ${daysUntilDeadline} days`
            : `Project is ${Math.abs(daysUntilDeadline)} days overdue`,
        icon: project.status === 'Completed' ? '🎯' : daysUntilDeadline > 0 ? '⏰' : '🚨',
        status: project.status === 'Completed' 
          ? 'completed' 
          : daysUntilDeadline > 0 
            ? 'upcoming' 
            : 'overdue'
      });
    }

    // Sort events by date (most recent first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [project, tasks, teamMembers, comments]);

  // Calculate project health metrics
  const projectHealth = useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const totalTasks = tasks.length;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const now = new Date();
    const projectStart = project.startDate ? (typeof project.startDate === 'string' ? parseISO(project.startDate) : new Date(project.startDate)) : now;
    const projectEnd = project.endDate ? (typeof project.endDate === 'string' ? parseISO(project.endDate) : new Date(project.endDate)) : now;
    
    const totalDuration = projectEnd.getTime() - projectStart.getTime();
    const elapsed = Math.max(0, now.getTime() - projectStart.getTime());
    const timeProgress = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;

    const isOnTrack = taskProgress >= timeProgress - 10; // Allow 10% tolerance
    const isAtRisk = taskProgress < timeProgress - 10 && taskProgress > timeProgress - 25;
    const isCritical = taskProgress <= timeProgress - 25;

    let status: 'on_track' | 'at_risk' | 'critical' = 'on_track';
    if (isCritical) status = 'critical';
    else if (isAtRisk) status = 'at_risk';

    return {
      taskProgress,
      timeProgress,
      status,
      isOnTrack,
      isAtRisk,
      isCritical,
      completedTasks,
      totalTasks,
      daysElapsed: Math.ceil(elapsed / (1000 * 60 * 60 * 24)),
      daysRemaining: Math.ceil((projectEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    };
  }, [project, tasks]);

  return {
    timelineEvents,
    projectHealth
  };
};
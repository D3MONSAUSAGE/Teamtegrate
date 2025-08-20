import { useMemo } from 'react';
import { format } from 'date-fns';
import { Task, Project, User } from '@/types';
import { DateRange } from 'react-day-picker';
import { calculateDateRange, formatDateRangeForExport } from '@/utils/dateRangeUtils';

export type ExportType = 'overview' | 'detailed-tasks' | 'user-performance' | 'comprehensive-user' | 'project-breakdown' | 'time-tracking';

export interface ExportOptions {
  type: ExportType;
  dateRange?: DateRange;
  timeRange: string;
  selectedProjects: string[];
  selectedMembers: string[];
  selectedUser?: string;
}

export interface EnhancedExportData {
  filename: string;
  headers: string[];
  rows: string[][];
  metadata: {
    exportType: string;
    dateRange: string;
    filters: string;
    generatedAt: string;
    totalRecords: number;
  };
}

export const useEnhancedExport = (
  tasks: Task[],
  projects: Project[],
  teamMembers: Array<{ id: string; name: string; email?: string }>,
  options: ExportOptions
): EnhancedExportData => {
  return useMemo(() => {
    const { type, dateRange, timeRange, selectedProjects, selectedMembers, selectedUser } = options;
    
    // Calculate date range using the new utility
    const calculatedDateRange = calculateDateRange(timeRange, dateRange);
    const { from: startDate, to: endDate } = calculatedDateRange;

    console.log('Enhanced export starting with', tasks.length, 'tasks');
    console.log('Date range for export:', startDate, 'to', endDate);
    
    // Filter tasks by date range
    let filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt || task.updatedAt);
      return taskDate >= startDate && taskDate <= endDate;
    });
    console.log('After date filter:', filteredTasks.length, 'tasks');
    
    // Filter by selected projects
    if (selectedProjects.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.projectId && selectedProjects.includes(task.projectId)
      );
      console.log('After project filter:', filteredTasks.length, 'tasks');
    }
    
    // Filter by selected members - check both single and multiple assignees
    if (selectedMembers.length > 0) {
      filteredTasks = filteredTasks.filter(task => {
        // Check single assignee
        if (task.assignedToId && selectedMembers.includes(task.assignedToId)) {
          return true;
        }
        // Check multiple assignees
        if (task.assignedToIds && task.assignedToIds.some(id => selectedMembers.includes(id))) {
          return true;
        }
        return false;
      });
      console.log('After member filter:', filteredTasks.length, 'tasks');
    }
    
    // Filter by specific user if selected
    if (selectedUser) {
      filteredTasks = filteredTasks.filter(task => {
        // Check single assignee
        if (task.assignedToId === selectedUser) {
          return true;
        }
        // Check multiple assignees
        if (task.assignedToIds && task.assignedToIds.includes(selectedUser)) {
          return true;
        }
        return false;
      });
      console.log('After specific user filter:', filteredTasks.length, 'tasks');
    }
    
    console.log('Final filtered tasks for export:', filteredTasks.length);

    const generateExportData = (): { headers: string[], rows: string[][] } => {
      switch (type) {
        case 'overview':
          return generateOverviewExport(filteredTasks, projects, teamMembers);
        case 'detailed-tasks':
          return generateDetailedTasksExport(filteredTasks, projects, teamMembers);
        case 'user-performance':
          return generateUserPerformanceExport(filteredTasks, teamMembers);
        case 'project-breakdown':
          return generateProjectBreakdownExport(filteredTasks, projects, teamMembers);
        case 'time-tracking':
          return generateTimeTrackingExport(filteredTasks, teamMembers);
        default:
          return generateOverviewExport(filteredTasks, projects, teamMembers);
      }
    };

    const { headers, rows } = generateExportData();
    
    // Generate filename
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const userStr = selectedUser ? `-${teamMembers.find(m => m.id === selectedUser)?.name?.replace(/\s+/g, '-') || 'user'}` : '';
    const filename = `${type}-report${userStr}-${dateStr}.csv`;

    // Generate metadata
    const filterStrings = [];
    if (selectedProjects.length > 0) {
      filterStrings.push(`Projects: ${selectedProjects.length} selected`);
    }
    if (selectedMembers.length > 0) {
      filterStrings.push(`Members: ${selectedMembers.length} selected`);
    }
    if (selectedUser) {
      const userName = teamMembers.find(m => m.id === selectedUser)?.name || 'Unknown';
      filterStrings.push(`User: ${userName}`);
    }

    const metadata = {
      exportType: type,
      dateRange: formatDateRangeForExport(calculatedDateRange),
      filters: filterStrings.length > 0 ? filterStrings.join(', ') : 'No filters applied',
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      totalRecords: rows.length
    };

    return {
      filename,
      headers,
      rows,
      metadata
    };
  }, [tasks, projects, teamMembers, options]);
};

const generateOverviewExport = (
  tasks: Task[], 
  projects: Project[], 
  teamMembers: Array<{ id: string; name: string }>
): { headers: string[], rows: string[][] } => {
  const headers = ['Metric', 'Value'];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const todoTasks = tasks.filter(t => t.status === 'To Do').length;
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Completed').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'High').length;
  const activeProjects = projects.filter(p => p.status !== 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const rows = [
    ['Total Tasks', totalTasks.toString()],
    ['Completed Tasks', completedTasks.toString()],
    ['In Progress Tasks', inProgressTasks.toString()],
    ['To Do Tasks', todoTasks.toString()],
    ['Overdue Tasks', overdueTasks.toString()],
    ['High Priority Tasks', highPriorityTasks.toString()],
    ['Active Projects', activeProjects.toString()],
    ['Completion Rate', `${completionRate}%`],
    ['Team Members', teamMembers.length.toString()]
  ];

  return { headers, rows };
};

const generateDetailedTasksExport = (
  tasks: Task[], 
  projects: Project[], 
  teamMembers: Array<{ id: string; name: string }>
): { headers: string[], rows: string[][] } => {
  const headers = [
    'Task ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Created Date',
    'Deadline',
    'Completed Date',
    'Creator',
    'Assigned To',
    'Project',
    'Cost',
    'Overdue',
    'Days to Completion'
  ];

  const rows = tasks.map(task => {
    const creator = teamMembers.find(m => m.id === task.userId)?.name || 'Unknown';
    const assignedTo = task.assignedToName || 
                      teamMembers.find(m => m.id === task.assignedToId)?.name || 
                      (task.assignedToNames && task.assignedToNames.length > 0 ? task.assignedToNames.join(', ') : 'Unassigned');
    const project = projects.find(p => p.id === task.projectId)?.title || 'No Project';
    const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';
    const daysToCompletion = task.completedAt && task.createdAt 
      ? Math.ceil((new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : '';

    return [
      task.id,
      task.title,
      task.description || '',
      task.status,
      task.priority,
      format(new Date(task.createdAt), 'yyyy-MM-dd'),
      format(new Date(task.deadline), 'yyyy-MM-dd'),
      task.completedAt ? format(new Date(task.completedAt), 'yyyy-MM-dd') : '',
      creator,
      assignedTo,
      project,
      task.cost?.toString() || '0',
      isOverdue ? 'Yes' : 'No',
      daysToCompletion.toString()
    ];
  });

  return { headers, rows };
};

const generateUserPerformanceExport = (
  tasks: Task[], 
  teamMembers: Array<{ id: string; name: string }>
): { headers: string[], rows: string[][] } => {
  const headers = [
    'User Name',
    'Total Tasks',
    'Completed Tasks',
    'In Progress Tasks',
    'To Do Tasks',
    'Overdue Tasks',
    'Completion Rate',
    'Avg Days to Complete',
    'High Priority Tasks'
  ];

  const userStats = teamMembers.map(member => {
    const userTasks = tasks.filter(t => 
      t.userId === member.id || 
      t.assignedToId === member.id ||
      (t.assignedToIds && t.assignedToIds.includes(member.id))
    );
    
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = userTasks.filter(t => t.status === 'In Progress').length;
    const todoTasks = userTasks.filter(t => t.status === 'To Do').length;
    const overdueTasks = userTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const highPriorityTasks = userTasks.filter(t => t.priority === 'High').length;
    
    const completedTasksWithDates = userTasks.filter(t => t.status === 'Completed' && t.completedAt && t.createdAt);
    const avgDaysToComplete = completedTasksWithDates.length > 0 
      ? Math.round(completedTasksWithDates.reduce((sum, task) => {
          const days = (new Date(task.completedAt!).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedTasksWithDates.length)
      : 0;

    return [
      member.name,
      totalTasks.toString(),
      completedTasks.toString(),
      inProgressTasks.toString(),
      todoTasks.toString(),
      overdueTasks.toString(),
      `${completionRate}%`,
      avgDaysToComplete.toString(),
      highPriorityTasks.toString()
    ];
  }).filter(row => parseInt(row[1]) > 0); // Only include users with tasks

  return { headers, rows: userStats };
};

const generateProjectBreakdownExport = (
  tasks: Task[], 
  projects: Project[], 
  teamMembers: Array<{ id: string; name: string }>
): { headers: string[], rows: string[][] } => {
  const headers = [
    'Project Name',
    'Status',
    'Manager',
    'Total Tasks',
    'Completed Tasks',
    'In Progress Tasks',
    'To Do Tasks',
    'Completion Rate',
    'Budget',
    'Budget Spent',
    'Budget Remaining',
    'Team Members Count'
  ];

  const projectStats = projects.map(project => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = projectTasks.filter(t => t.status === 'In Progress').length;
    const todoTasks = projectTasks.filter(t => t.status === 'To Do').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const manager = teamMembers.find(m => m.id === project.managerId)?.name || 'Unassigned';
    const budgetRemaining = (project.budget || 0) - (project.budgetSpent || 0);

    return [
      project.title,
      project.status || 'To Do',
      manager,
      totalTasks.toString(),
      completedTasks.toString(),
      inProgressTasks.toString(),
      todoTasks.toString(),
      `${completionRate}%`,
      project.budget?.toString() || '0',
      project.budgetSpent?.toString() || '0',
      budgetRemaining.toString(),
      (project.teamMembers?.length || 0).toString()
    ];
  });

  return { headers, rows: projectStats };
};

const generateTimeTrackingExport = (
  tasks: Task[], 
  teamMembers: Array<{ id: string; name: string }>
): { headers: string[], rows: string[][] } => {
  const headers = [
    'Task ID',
    'Title',
    'Assigned To',
    'Status',
    'Created Date',
    'Deadline',
    'Completed Date',
    'Estimated Duration (Days)',
    'Actual Duration (Days)',
    'Time Efficiency'
  ];

  const rows = tasks.map(task => {
    const assignedTo = task.assignedToName || 
                      teamMembers.find(m => m.id === task.assignedToId)?.name || 
                      'Unassigned';
    
    const createdDate = new Date(task.createdAt);
    const deadline = new Date(task.deadline);
    const estimatedDuration = Math.ceil((deadline.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let actualDuration = '';
    let efficiency = '';
    
    if (task.completedAt) {
      const completedDate = new Date(task.completedAt);
      const actualDays = Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      actualDuration = actualDays.toString();
      
      if (estimatedDuration > 0) {
        const efficiencyRatio = estimatedDuration / actualDays;
        efficiency = efficiencyRatio > 1 ? 'Ahead of Schedule' : 
                    efficiencyRatio > 0.8 ? 'On Time' : 'Behind Schedule';
      }
    }

    return [
      task.id,
      task.title,
      assignedTo,
      task.status,
      format(createdDate, 'yyyy-MM-dd'),
      format(deadline, 'yyyy-MM-dd'),
      task.completedAt ? format(new Date(task.completedAt), 'yyyy-MM-dd') : '',
      estimatedDuration.toString(),
      actualDuration,
      efficiency
    ];
  });

  return { headers, rows };
};
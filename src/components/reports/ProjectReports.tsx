
import React from 'react';
import { useTask } from '@/contexts/task';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, isAfter } from 'date-fns';
import ProjectSelector from './ProjectSelector';

const ProjectReports: React.FC = () => {
  const { projects, tasks } = useTask();
  
  // State for selected projects with localStorage persistence
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('selectedProjectIds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  
  // Initialize with top 5 projects if no selection exists
  React.useEffect(() => {
    if (selectedProjectIds.length === 0 && projects.length > 0) {
      const topProjects = projects
        .slice(0, 5)
        .map(p => p.id);
      setSelectedProjectIds(topProjects);
    }
  }, [projects, selectedProjectIds.length]);
  
  // Save to localStorage whenever selection changes
  React.useEffect(() => {
    localStorage.setItem('selectedProjectIds', JSON.stringify(selectedProjectIds));
  }, [selectedProjectIds]);
  
  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else if (prev.length < 5) {
        return [...prev, projectId];
      }
      return prev;
    });
  };
  
  const handleRemoveProject = (projectId: string) => {
    setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
  };
  
  const handleClearAll = () => {
    setSelectedProjectIds([]);
  };
  
  // Filter projects based on selection
  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));
  
  // Project completion status for selected projects
  const projectStatus = React.useMemo(() => {
    if (selectedProjects.length === 0) return [];
    
    const dataMap = new Map();
    selectedProjects.forEach(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'Completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Today's date
      const now = new Date();
      // Check if project is overdue
      const isOverdue = project.endDate && isAfter(now, new Date(project.endDate));
      
      dataMap.set(project.title, {
        name: project.title,
        total: totalTasks,
        completed: completedTasks,
        completionRate,
        isOverdue
      });
    });
    
    return Array.from(dataMap.values());
  }, [selectedProjects]);
  
  // Project tasks by status for selected projects
  const projectTasksByStatus = React.useMemo(() => {
    if (selectedProjects.length === 0) return [];
    
    return selectedProjects.slice(0, 5).map(project => {
      const statusCounts = {
        'To Do': 0,
        'In Progress': 0,
        'Pending': 0,
        'Completed': 0
      };
      
      project.tasks.forEach(task => {
        statusCounts[task.status]++;
      });
      
      return {
        name: project.title,
        ...statusCounts
      };
    });
  }, [selectedProjects]);
  
  // Project on-time completion rate
  const onTimeCompletionData = React.useMemo(() => {
    const onTime = projects.filter(project => {
      if (!project.endDate) return false;
      
      const completedTasks = project.tasks.filter(task => task.status === 'Completed');
      const allTasksCompleted = completedTasks.length === project.tasks.length;
      
      const endDate = new Date(project.endDate);
      const now = new Date();
      
      return allTasksCompleted && !isAfter(now, endDate);
    }).length;
    
    const overdue = projects.filter(project => {
      if (!project.endDate) return false;
      
      const endDate = new Date(project.endDate);
      const now = new Date();
      
      return isAfter(now, endDate);
    }).length;
    
    const inProgress = projects.length - onTime - overdue;
    
    return [
      { name: 'On Time', value: onTime },
      { name: 'In Progress', value: inProgress },
      { name: 'Overdue', value: overdue }
    ];
  }, [projects]);
  
  // Colors for the charts
  const COLORS = ['#00C49F', '#0088FE', '#FF8042'];
  const STATUS_COLORS = {
    'To Do': '#8884d8',
    'In Progress': '#0088FE',
    'Pending': '#FFBB28',
    'Completed': '#00C49F'
  };
  
  return (
    <div className="space-y-6">
      {/* Project Completion Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Project Completion Rates</CardTitle>
          <CardDescription>
            Select up to 5 projects to track their completion progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Selector integrated into this card */}
          <ProjectSelector
            projects={projects}
            selectedProjectIds={selectedProjectIds}
            onProjectToggle={handleProjectToggle}
            onRemoveProject={handleRemoveProject}
            onClearAll={handleClearAll}
            maxProjects={5}
          />
          
          {/* Chart */}
          <div className="h-96">
            {projectStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectStatus}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar 
                    dataKey="completionRate" 
                    name="Completion Rate" 
                    fill="#0088FE"
                    background={{ fill: '#eee' }}
                  >
                    {projectStatus.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isOverdue ? '#FF8042' : '#0088FE'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select projects to view completion rates</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Project Tasks by Status</CardTitle>
            <CardDescription>Distribution of task statuses within selected projects</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {projectTasksByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectTasksByStatus}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{width: 20}} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="To Do" name="To Do" fill={STATUS_COLORS['To Do']} />
                  <Bar dataKey="In Progress" name="In Progress" fill={STATUS_COLORS['In Progress']} />
                  <Bar dataKey="Pending" name="Pending" fill={STATUS_COLORS['Pending']} />
                  <Bar dataKey="Completed" name="Completed" fill={STATUS_COLORS['Completed']} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select projects to view task distribution</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Project On-Time Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline Analysis</CardTitle>
            <CardDescription>On-time vs. delayed project completion</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={onTimeCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {onTimeCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectReports;

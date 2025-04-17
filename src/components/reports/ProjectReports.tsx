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

const ProjectReports: React.FC = () => {
  const { projects, tasks } = useTask();
  
  // Project completion status
  const projectStatus = React.useMemo(() => {
    if (projects.length === 0) return [];
    
    const dataMap = new Map();
    projects.forEach(project => {
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
  }, [projects]);
  
  // Project tasks by status
  const projectTasksByStatus = React.useMemo(() => {
    if (projects.length === 0) return [];
    
    return projects.slice(0, 5).map(project => {
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
        name: project.title.length > 10 ? project.title.substring(0, 10) + '...' : project.title,
        ...statusCounts
      };
    });
  }, [projects]);
  
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
          <CardDescription>Progress of each project</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
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
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Project Tasks by Status</CardTitle>
            <CardDescription>Distribution of task statuses within top 5 projects</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectTasksByStatus}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  interval={0} 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="To Do" name="To Do" fill={STATUS_COLORS['To Do']} />
                <Bar dataKey="In Progress" name="In Progress" fill={STATUS_COLORS['In Progress']} />
                <Bar dataKey="Pending" name="Pending" fill={STATUS_COLORS['Pending']} />
                <Bar dataKey="Completed" name="Completed" fill={STATUS_COLORS['Completed']} />
              </BarChart>
            </ResponsiveContainer>
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


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
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import useTeamMembers from '@/hooks/useTeamMembers';
import { getTasksCompletionByTeamMember } from '@/contexts/task/taskMetrics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TeamReports: React.FC = () => {
  const { tasks } = useTask();
  const { teamMembersPerformance } = useTeamMembers();
  
  // Team member performance data
  const memberPerformanceData = React.useMemo(() => {
    return teamMembersPerformance.map(member => ({
      name: member.name,
      assignedTasks: member.totalTasks,
      completedTasks: member.completedTasks,
      completionRate: member.completionRate
    }));
  }, [teamMembersPerformance]);
  
  // Team member skill matrix (simulated data)
  const skillMatrixData = React.useMemo(() => {
    return teamMembersPerformance.slice(0, 5).map(member => ({
      subject: member.name,
      A: Math.round(Math.random() * 50) + 50, // Task completion
      B: Math.round(Math.random() * 40) + 60, // Communication
      C: Math.round(Math.random() * 30) + 70, // Collaboration
      D: Math.round(Math.random() * 50) + 50, // Technical skills
      E: Math.round(Math.random() * 40) + 60  // Problem solving
    }));
  }, [teamMembersPerformance]);
  
  // Task types distribution by team member
  const memberTaskCategoriesData = React.useMemo(() => {
    const categories = ['Development', 'Design', 'Planning', 'Testing', 'Documentation'];
    
    return teamMembersPerformance.slice(0, 5).map(member => {
      const data: Record<string, any> = { name: member.name };
      
      categories.forEach(category => {
        // Simulated data for task categories
        data[category] = Math.floor(Math.random() * member.totalTasks);
      });
      
      return data;
    });
  }, [teamMembersPerformance]);
  
  // Productivity trends (simulated)
  const productivityTrend = React.useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const data = [];
    
    for (const week of weeks) {
      const weekData: Record<string, any> = { name: week };
      
      // Add data for top 3 team members
      teamMembersPerformance.slice(0, 3).forEach(member => {
        weekData[member.name] = Math.floor(Math.random() * 20) + 5;
      });
      
      data.push(weekData);
    }
    
    return data;
  }, [teamMembersPerformance]);
  
  return (
    <div className="space-y-6">
      {/* Team Member Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
          <CardDescription>Task completion metrics by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={memberPerformanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="assignedTasks" name="Assigned Tasks" fill="#8884d8" />
                <Bar yAxisId="left" dataKey="completedTasks" name="Completed Tasks" fill="#00C49F" />
                <Bar yAxisId="right" dataKey="completionRate" name="Completion Rate (%)" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Member Skill Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Team Skill Matrix</CardTitle>
            <CardDescription>Skill assessment across different areas</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="text-xs mb-2 text-center">
              <span className="mr-4">A: Task Completion</span>
              <span className="mr-4">B: Communication</span>
              <span className="mr-4">C: Collaboration</span>
              <span className="mr-4">D: Technical Skills</span>
              <span>E: Problem Solving</span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillMatrixData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar name="A" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="B" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Radar name="C" dataKey="C" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                <Radar name="D" dataKey="D" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
                <Radar name="E" dataKey="E" stroke="#0088fe" fill="#0088fe" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Team Productivity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Productivity Trend</CardTitle>
            <CardDescription>Weekly tasks completed by top team members</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={productivityTrend}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {teamMembersPerformance.slice(0, 3).map((member, index) => (
                  <Line 
                    key={member.id}
                    type="monotone" 
                    dataKey={member.name} 
                    stroke={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} 
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Member Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Rankings</CardTitle>
          <CardDescription>Performance rankings based on task completion</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tasks Assigned</TableHead>
                <TableHead>Tasks Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Projects</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembersPerformance
                .sort((a, b) => b.completionRate - a.completionRate)
                .map((member, index) => (
                  <TableRow key={member.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.totalTasks}</TableCell>
                    <TableCell>{member.completedTasks}</TableCell>
                    <TableCell>{member.completionRate}%</TableCell>
                    <TableCell>{member.projects}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamReports;


import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamMemberPerformance {
  name: string;
  assignedTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface TeamPerformanceChartProps {
  memberPerformanceData: TeamMemberPerformance[];
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ 
  memberPerformanceData 
}) => {
  return (
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
  );
};

export default TeamPerformanceChart;

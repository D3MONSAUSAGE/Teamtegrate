
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberPerformance } from '@/types/performance';

interface TeamPerformanceBarChartProps {
  memberPerformanceData: {
    name: string;
    assignedTasks: number;
    completedTasks: number;
    completionRate: number;
  }[];
}

const TeamPerformanceBarChart: React.FC<TeamPerformanceBarChartProps> = ({ memberPerformanceData }) => {
  const colors = {
    assignedTasks: "#8884d8",
    completedTasks: "#00C49F",
    completionRate: "#FFBB28"
  };

  // Sort data by completion rate for better visualization
  const sortedData = [...memberPerformanceData].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Team Member Performance</CardTitle>
        <CardDescription>Task completion metrics by team member</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              barGap={2}
              barSize={18}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                height={60}
                tickMargin={10}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
                label={{ 
                  value: 'Tasks', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[0, 100]} 
                tick={{ fontSize: 12 }}
                tickMargin={10}
                label={{ 
                  value: 'Completion Rate (%)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "completionRate") return [`${value}%`, "Completion Rate"];
                  if (name === "assignedTasks") return [value, "Assigned Tasks"];
                  if (name === "completedTasks") return [value, "Completed Tasks"];
                  return [value, name];
                }}
                contentStyle={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.9)", 
                  borderRadius: "6px", 
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                  border: "1px solid #f0f0f0"
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => {
                  if (value === "assignedTasks") return "Assigned Tasks";
                  if (value === "completedTasks") return "Completed Tasks";
                  if (value === "completionRate") return "Completion Rate (%)";
                  return value;
                }}
              />
              <Bar 
                yAxisId="left" 
                dataKey="assignedTasks" 
                fill={colors.assignedTasks} 
                radius={[3, 3, 0, 0]} 
              />
              <Bar 
                yAxisId="left" 
                dataKey="completedTasks" 
                fill={colors.completedTasks}
                radius={[3, 3, 0, 0]} 
              />
              <Bar 
                yAxisId="right" 
                dataKey="completionRate" 
                fill={colors.completionRate}
                radius={[3, 3, 0, 0]} 
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.completionRate > 75 ? "#4CAF50" : entry.completionRate > 50 ? "#FFC107" : "#FF5722"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceBarChart;

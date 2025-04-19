
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamProductivityTrendProps {
  productivityTrend: Array<Record<string, any>>;
  teamMembers: Array<{ name: string }>;
}

const TeamProductivityTrend: React.FC<TeamProductivityTrendProps> = ({ 
  productivityTrend, 
  teamMembers 
}) => {
  return (
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
            {teamMembers.slice(0, 3).map((member, index) => (
              <Line 
                key={member.name}
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
  );
};

export default TeamProductivityTrend;

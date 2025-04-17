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

interface ProductivityData {
  name: string;
  [key: string]: string | number;
}

interface ProductivityTrendChartProps {
  productivityTrend: ProductivityData[];
  teamMembersPerformance: { id: string; name: string }[];
}

const ProductivityTrendChart: React.FC<ProductivityTrendChartProps> = ({ 
  productivityTrend,
  teamMembersPerformance
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
  );
};

export default ProductivityTrendChart;

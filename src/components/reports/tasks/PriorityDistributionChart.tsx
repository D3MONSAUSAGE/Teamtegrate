
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PriorityDistributionData, PRIORITY_COLORS, COLORS } from './types';
import { TaskPriority } from '@/types';

interface PriorityDistributionChartProps {
  data: PriorityDistributionData[];
}

const PriorityDistributionChart: React.FC<PriorityDistributionChartProps> = ({ data }) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg md:text-xl">Task Priority Distribution</CardTitle>
        </div>
        <CardDescription>Breakdown of tasks by priority level</CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "h-64" : "h-80"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={isMobile ? 
              { top: 10, right: 10, left: 0, bottom: 30 } : 
              { top: 20, right: 30, left: 20, bottom: 5 }
            }
            layout={isMobile ? "vertical" : "horizontal"}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isMobile ? (
              <>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            <Tooltip />
            <Legend wrapperStyle={isMobile ? { fontSize: '11px', marginTop: '10px' } : {}} />
            <Bar dataKey="value" name="Tasks">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={PRIORITY_COLORS[entry.name as TaskPriority] || COLORS[index % COLORS.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PriorityDistributionChart;

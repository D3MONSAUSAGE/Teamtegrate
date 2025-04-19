
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChartIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TaskCompletionTrendProps {
  completionTrend: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
}

const TaskCompletionTrend: React.FC<TaskCompletionTrendProps> = ({ completionTrend }) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <LineChartIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg md:text-xl">Task Completion Trend</CardTitle>
        </div>
        <CardDescription>Task completion over the last 14 days</CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "h-72" : "h-80"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={completionTrend}
            margin={isMobile ? 
              { top: 10, right: 10, left: -15, bottom: 60 } : 
              { top: 20, right: 30, left: 20, bottom: 5 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 70 : 30}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 1 : 0}
            />
            <YAxis 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 25 : 40}
            />
            <Tooltip />
            <Legend 
              wrapperStyle={isMobile ? { position: 'relative', marginTop: '10px', fontSize: '11px' } : undefined}
              verticalAlign={isMobile ? "top" : "bottom"}
            />
            <Bar dataKey="completed" name="Completed Tasks" fill="#00C49F" />
            <Bar dataKey="total" name="Total Tasks" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TaskCompletionTrend;


import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartIcon } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import { TaskStatus } from '@/types';

interface TaskStatusDistributionProps {
  statusCounts: Array<{ name: string; value: number }>;
}

const TaskStatusDistribution: React.FC<TaskStatusDistributionProps> = ({ statusCounts }) => {
  const isMobile = useIsMobile();
  const COLORS = ['#0088FE', '#00C49F', '#FF8042'];

  const renderPieChartLabel = (props: any) => {
    const { percent } = props;
    if (!isMobile || (percent && percent > 0.15)) {
      return `${((percent || 0) * 100).toFixed(0)}%`;
    }
    return null;
  };

  const chartConfig = {
    'To Do': { color: COLORS[0] },
    'In Progress': { color: COLORS[1] },
    'Completed': { color: COLORS[2] }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg md:text-xl">Task Status Distribution</CardTitle>
        </div>
        <CardDescription>Breakdown of tasks by status</CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "h-64" : "h-80"}>
        <ChartContainer config={chartConfig} className="h-full w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusCounts}
                cx="50%"
                cy="50%"
                labelLine={!isMobile}
                outerRadius={isMobile ? 50 : 80}
                innerRadius={isMobile ? 20 : 30}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={renderPieChartLabel}
              >
                {statusCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend 
                layout="horizontal"
                verticalAlign="bottom" 
                align="center"
                formatter={(value) => <span className="text-xs">{value}</span>}
                iconSize={8}
                wrapperStyle={{ 
                  fontSize: isMobile ? '9px' : '12px',
                  paddingTop: '10px',
                  width: '100%',
                  maxWidth: '100%',
                  margin: '0 auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TaskStatusDistribution;

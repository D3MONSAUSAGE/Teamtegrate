
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
  
  // Define consistent colors for each status to ensure they match both in the chart and legend
  const STATUS_COLORS = {
    'To Do': '#0088FE',
    'In Progress': '#00C49F',
    'Pending': '#FFBB28',
    'Completed': '#FF8042'
  };
  
  // Ensure our data is in a consistent order to match the legend
  const orderedStatuses = ['To Do', 'In Progress', 'Pending', 'Completed'];
  const orderedData = orderedStatuses.map(status => {
    const existingItem = statusCounts.find(item => item.name === status);
    return {
      name: status,
      value: existingItem ? existingItem.value : 0
    };
  });

  const renderPieChartLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (!isMobile || percent > 0.15) {
      return `${(percent * 100).toFixed(0)}%`;
    }
    return null;
  };

  // Create chart config with consistent colors
  const chartConfig = {
    'To Do': { color: STATUS_COLORS['To Do'] },
    'In Progress': { color: STATUS_COLORS['In Progress'] },
    'Pending': { color: STATUS_COLORS['Pending'] },
    'Completed': { color: STATUS_COLORS['Completed'] }
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
        <ChartContainer config={chartConfig} className="h-full">
          <PieChart>
            <Pie
              data={orderedData}
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
              {orderedData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name as TaskStatus]} />
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
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TaskStatusDistribution;

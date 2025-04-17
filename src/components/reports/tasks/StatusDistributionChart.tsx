
import React from 'react';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { StatusDistributionData, COLORS } from './types';

interface StatusDistributionChartProps {
  data: StatusDistributionData[];
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  const isMobile = useIsMobile();

  const chartConfig = {
    'To Do': { color: COLORS[0] },
    'In Progress': { color: COLORS[1] },
    'Pending': { color: COLORS[2] },
    'Completed': { color: COLORS[3] },
  };

  // Responsive label rendering function for the pie chart
  const renderPieChartLabel = ({ name, percent }: { name: string; percent: number }) => {
    // Only show labels on desktop or for sections with enough space (more than 15%)
    if (!isMobile || percent > 0.15) {
      return `${(percent * 100).toFixed(0)}%`;
    }
    return null;
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
              data={data}
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Legend 
              layout={isMobile ? "horizontal" : "vertical"} 
              verticalAlign={isMobile ? "bottom" : "middle"} 
              align={isMobile ? "center" : "right"}
              wrapperStyle={isMobile ? { fontSize: '11px' } : { fontSize: '12px' }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;

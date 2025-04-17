
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

  // Chart configuration for different statuses
  const chartConfig = {
    'To Do': { color: COLORS[0] },
    'In Progress': { color: COLORS[1] },
    'Pending': { color: COLORS[2] },
    'Completed': { color: COLORS[3] },
  };

  // Render pie chart cells based on data
  const renderPieChartCells = () => {
    return data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ));
  };

  // Responsive label rendering function for the pie chart
  const renderPieChartLabel = ({ name, percent }: { name: string; percent: number }) => {
    // Only show labels on desktop or for sections with enough space (more than 15%)
    if (!isMobile || percent > 0.15) {
      return `${(percent * 100).toFixed(0)}%`;
    }
    return null;
  };
  
  // Get chart dimensions based on device
  const getChartDimensions = () => {
    if (isMobile) {
      return {
        outerRadius: 50,
        innerRadius: 20
      };
    }
    return {
      outerRadius: 80,
      innerRadius: 30
    };
  };
  
  // Get legend configuration based on device
  const getLegendConfig = () => {
    const baseFontSize = isMobile ? '11px' : '12px';
    
    if (isMobile) {
      return {
        layout: 'horizontal',
        verticalAlign: 'bottom', 
        align: 'center',
        wrapperStyle: {
          fontSize: baseFontSize, 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center'
        }
      };
    }
    
    return {
      layout: 'vertical',
      verticalAlign: 'middle',
      align: 'right',
      wrapperStyle: {
        fontSize: baseFontSize
      }
    };
  };

  const dimensions = getChartDimensions();
  const legendConfig = getLegendConfig();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg md:text-xl">Task Status Distribution</CardTitle>
        </div>
        <CardDescription>Breakdown of tasks by status</CardDescription>
      </CardHeader>
      <CardContent className={`${isMobile ? "h-64 flex flex-col items-center justify-center" : "h-80"}`}>
        <ChartContainer config={chartConfig} className="h-full w-full max-w-[300px] mx-auto">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={!isMobile}
              outerRadius={dimensions.outerRadius}
              innerRadius={dimensions.innerRadius}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={renderPieChartLabel}
            >
              {renderPieChartCells()}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Legend 
              layout={legendConfig.layout}
              verticalAlign={legendConfig.verticalAlign} 
              align={legendConfig.align}
              wrapperStyle={legendConfig.wrapperStyle}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;

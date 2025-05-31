
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Task } from '@/types';
import { sub, format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface CompletionRateChartProps {
  tasks: Task[];
}

interface ChartData {
  date: string;
  completed: number;
  all: number;
  rate: number;
}

const CompletionRateChart: React.FC<CompletionRateChartProps> = ({ tasks }) => {
  const isMobile = useIsMobile();
  
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const data: ChartData[] = [];
    
    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = sub(today, { days: i });
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, isMobile ? 'E' : 'EEE');
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.completed_at || task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime();
      });
      
      const completed = dayTasks.filter(task => task.status === 'Done').length;
      const all = dayTasks.length;
      const rate = all > 0 ? Math.round((completed / all) * 100) : 0;
      
      data.push({
        date: displayDate,
        completed,
        all,
        rate,
      });
    }
    
    return data;
  }, [tasks, isMobile]);
  
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis 
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 12 }} 
            width={30}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'rate') return [`${value}%`, 'Completion Rate'];
              return [value, name === 'completed' ? 'Completed Tasks' : 'All Tasks'];
            }}
          />
          <Bar yAxisId="left" dataKey="rate" fill="#8884d8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompletionRateChart;

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, BarChart3, Clock } from 'lucide-react';

interface WeeklySalesButtonProps {
  onNavigateToWeekly: () => void;
  weeklyStats?: {
    currentWeekSales: number;
    weeklyGrowth: number;
    daysWithData: number;
  };
}

export const WeeklySalesButton: React.FC<WeeklySalesButtonProps> = ({
  onNavigateToWeekly,
  weeklyStats
}) => {
  return (
    <Card className="glass-card border-0 hover:shadow-lg transition-all duration-300 group cursor-pointer"
          onClick={onNavigateToWeekly}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Weekly Sales View
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Mon - Sun
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {weeklyStats && (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                ${weeklyStats.currentWeekSales.toLocaleString()}
              </span>
              <div className={`flex items-center gap-1 text-sm ${
                weeklyStats.weeklyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <TrendingUp className="w-3 h-3" />
                {weeklyStats.weeklyGrowth >= 0 ? '+' : ''}
                {weeklyStats.weeklyGrowth.toFixed(1)}%
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{weeklyStats.daysWithData}/7 days tracked</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Current week
              </div>
            </div>
          </>
        )}
        
        <Button 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToWeekly();
          }}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Weekly Analysis
        </Button>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, Target, BarChart3 } from 'lucide-react';

const CompactAnalytics: React.FC = () => {
  // Mock data - replace with real analytics
  const metrics = [
    { 
      label: 'Productivity Score', 
      value: '85%', 
      trend: '+5% this week', 
      icon: TrendingUp, 
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    { 
      label: 'Team Active', 
      value: '12/15', 
      trend: '80% online', 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    { 
      label: 'Hours This Week', 
      value: '28h', 
      trend: '+3h vs last week', 
      icon: Calendar, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    { 
      label: 'Goals Completed', 
      value: '7/10', 
      trend: '70% success rate', 
      icon: Target, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20'
    }
  ];

  return (
    <Card className="bg-card/70 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                    <span className="text-lg font-bold text-foreground">{metric.value}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{metric.trend}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactAnalytics;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, Target } from 'lucide-react';

const CompactAnalytics: React.FC = () => {
  // Mock data - replace with real analytics
  const metrics = [
    { label: 'Productivity', value: '85%', trend: '+5%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Team Active', value: '12/15', trend: '80%', icon: Users, color: 'text-blue-600' },
    { label: 'This Week', value: '28h', trend: '+3h', icon: Calendar, color: 'text-purple-600' },
    { label: 'Goals Met', value: '7/10', trend: '70%', icon: Target, color: 'text-amber-600' }
  ];

  return (
    <Card className="bg-card/70 backdrop-blur-sm border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Analytics</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                  <span className="text-xs text-muted-foreground">{metric.trend}</span>
                </div>
                <div className="text-lg font-bold">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactAnalytics;

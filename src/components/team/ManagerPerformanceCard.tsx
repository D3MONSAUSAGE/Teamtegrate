
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface ManagerPerformanceCardProps {
  manager: {
    id: string;
    name: string;
    email: string;
    role: string;
    completionRate: number;
    totalTasks: number;
    dueTodayTasks: number;
    projects: number;
  };
}

const ManagerPerformanceCard: React.FC<ManagerPerformanceCardProps> = ({ manager }) => {
  const isMobile = useIsMobile();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className={`flex items-start ${isMobile ? 'flex-col' : 'justify-between'} mb-4`}>
          <div className="flex items-center mb-2">
            <div className="h-10 w-10 mr-4 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{manager.name}</h3>
                <Badge variant="default" className="text-xs">Manager</Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{manager.email}</p>
            </div>
          </div>
          <div className={`flex items-center ${isMobile ? 'self-end' : ''}`}>
            <Badge variant="outline">{manager.totalTasks} Tasks</Badge>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Task Completion</span>
              <span className="font-medium">{manager.completionRate}%</span>
            </div>
            <Progress value={manager.completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md text-blue-800 dark:text-blue-200">
              <div className="text-xs text-gray-500 dark:text-gray-400">Due Today</div>
              <div className="font-semibold">{manager.dueTodayTasks}</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-md text-purple-800 dark:text-purple-200">
              <div className="text-xs text-gray-500 dark:text-gray-400">Projects</div>
              <div className="font-semibold">{manager.projects}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManagerPerformanceCard;

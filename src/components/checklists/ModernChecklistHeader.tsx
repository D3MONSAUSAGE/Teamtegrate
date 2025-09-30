import React from 'react';
import { ClipboardList, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ModernChecklistHeaderProps {
  title: string;
  subtitle: string;
  stats?: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

const ModernChecklistHeader: React.FC<ModernChecklistHeaderProps> = ({
  title,
  subtitle,
  stats
}) => {
  const currentTime = new Date();
  const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy');
  const completionRate = stats ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-border/50 shadow-lg mb-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-36 -translate-x-36" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm">
              <ClipboardList className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-base text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{formattedDate}</div>
            <div className="text-xl font-semibold text-primary mt-1">
              <Clock className="inline h-4 w-4 mr-1" />
              {format(currentTime, 'h:mm a')}
            </div>
          </div>
        </div>

        {stats && stats.total > 0 && (
          <div className="flex items-center gap-4">
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-medium"
            >
              {stats.total} Total Tasks
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-success/10 text-success border-success/20 px-4 py-2 text-sm font-medium"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {completionRate}% Complete
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-accent/10 text-accent border-accent/20 px-4 py-2 text-sm font-medium"
            >
              {stats.inProgress} In Progress
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernChecklistHeader;

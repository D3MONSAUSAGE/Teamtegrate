import React from 'react';
import { Calendar, Users, Clock, TrendingUp, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ModernScheduleHeaderProps {
  title: string;
  subtitle: string;
  selectedTeamName?: string;
  onNotificationClick?: () => void;
  children?: React.ReactNode;
}

const ModernScheduleHeader: React.FC<ModernScheduleHeaderProps> = ({
  title,
  subtitle,
  selectedTeamName,
  onNotificationClick,
  children
}) => {
  const currentTime = new Date();
  const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(currentTime, 'h:mm a');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-border/50 shadow-lg mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-36 -translate-x-36" />
      
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-lg text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{formattedDate}</div>
              <div className="text-2xl font-semibold text-primary">{formattedTime}</div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="relative bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary/10 transition-all duration-300"
              onClick={onNotificationClick}
            >
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedTeamName && (
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-medium"
              >
                <Users className="h-4 w-4 mr-2" />
                {selectedTeamName}
              </Badge>
            )}
            
            <Badge 
              variant="outline" 
              className="bg-success/10 text-success border-success/20 px-4 py-2 text-sm font-medium"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Live Updates
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernScheduleHeader;
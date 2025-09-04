
import React from 'react';
import { Card, CardContent } from "@/components/ui/enhanced-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/enhanced-button";
import { Progress } from "@/components/ui/progress";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { Loader2, Trash2, Mail, Phone } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import ScreenReaderOnly from "@/components/accessibility/ScreenReaderOnly";

interface TeamMemberCardProps {
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
    completionRate: number;
    totalTasks: number;
    dueTodayTasks: number;
    projects: number;
  };
  onRemove: (memberId: string) => void;
  isRemoving?: boolean;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  member, 
  onRemove, 
  isRemoving = false 
}) => {
  const isMobile = useIsMobile();

  return (
    <Card 
      variant="interactive" 
      hover="lift" 
      className="group animate-fade-in"
      role="article"
      aria-labelledby={`member-${member.id}-name`}
    >
      <CardContent className="p-6">
        <div className={`flex items-start ${isMobile ? 'flex-col' : 'justify-between'} mb-4`}>
          <div className="flex items-center mb-2">
            <div 
              className="h-10 w-10 mr-4 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200"
              aria-hidden="true"
            >
              {member.name?.substring(0, 1).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 
                id={`member-${member.id}-name`}
                className="font-semibold truncate group-hover:text-primary transition-colors duration-200"
              >
                {member.name || 'Unknown User'}
              </h3>
              <ScreenReaderOnly>
                Team member details for {member.name || 'Unknown User'}
              </ScreenReaderOnly>
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center space-x-2'}`}>
                <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                <p className={`text-xs text-muted-foreground/70 truncate ${isMobile ? 'mt-1' : ''}`}>{member.email}</p>
              </div>
            </div>
          </div>
          <div className={`flex items-center ${isMobile ? 'self-end' : ''}`}>
            <Badge 
              variant="outline" 
              className="animate-scale-in"
              aria-label={`${member.totalTasks} tasks assigned`}
            >
              {member.totalTasks} Tasks
            </Badge>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 mobile-touch-target"
              onClick={() => onRemove(member.id)}
              disabled={isRemoving}
              loading={isRemoving}
              loadingText="Removing..."
              aria-label={`Remove ${member.name || 'member'} from team`}
            >
              {!isRemoving && <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <ProgressIndicator
              label="Task Completion"
              value={member.completionRate}
              showValue={true}
              variant={member.completionRate >= 80 ? 'success' : member.completionRate >= 60 ? 'default' : 'warning'}
              animated={true}
              aria-label={`Task completion rate: ${member.completionRate}%`}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-primary group-hover:bg-primary/10 transition-colors duration-200">
              <div className="text-xs text-muted-foreground">Due Today</div>
              <div className="font-semibold text-lg">{member.dueTodayTasks}</div>
              <ScreenReaderOnly>
                {member.dueTodayTasks} tasks due today
              </ScreenReaderOnly>
            </div>
            
            <div className="bg-accent/5 border border-accent/20 p-3 rounded-lg text-accent group-hover:bg-accent/10 transition-colors duration-200">
              <div className="text-xs text-muted-foreground">Projects</div>
              <div className="font-semibold text-lg">{member.projects}</div>
              <ScreenReaderOnly>
                Active in {member.projects} projects
              </ScreenReaderOnly>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMemberCard;

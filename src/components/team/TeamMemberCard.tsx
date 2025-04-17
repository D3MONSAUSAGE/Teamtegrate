
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trash2 } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

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
    <Card key={member.id}>
      <CardContent className="p-6">
        <div className={`flex items-start ${isMobile ? 'flex-col' : 'justify-between'} mb-4`}>
          <div className="flex items-center mb-2">
            <div 
              className="h-10 w-10 mr-4 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 flex-shrink-0"
            >
              {member.name.substring(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{member.name}</h3>
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center space-x-2'}`}>
                <p className="text-sm text-gray-500 truncate">{member.role}</p>
                <p className={`text-xs text-gray-400 truncate ${isMobile ? 'mt-1' : ''}`}>{member.email}</p>
              </div>
            </div>
          </div>
          <div className={`flex items-center ${isMobile ? 'self-end' : ''}`}>
            <Badge variant="outline">{member.totalTasks} Tasks</Badge>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
              onClick={() => onRemove(member.id)}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Task Completion</span>
              <span className="font-medium">{member.completionRate}%</span>
            </div>
            <Progress value={member.completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 p-2 rounded-md">
              <div className="text-xs text-gray-500">Due Today</div>
              <div className="font-semibold">{member.dueTodayTasks}</div>
            </div>
            
            <div className="bg-purple-50 p-2 rounded-md">
              <div className="text-xs text-gray-500">Projects</div>
              <div className="font-semibold">{member.projects}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMemberCard;

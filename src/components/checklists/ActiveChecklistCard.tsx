
import React from 'react';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Checklist } from '@/types/checklist';
import { useChecklists } from '@/contexts/checklists';
import { toast } from '@/components/ui/sonner';

interface ActiveChecklistCardProps {
  checklist: Checklist;
  onExecute: () => void;
  onChecklistExecuted?: (checklist: Checklist) => void; // <-- new
}

const ActiveChecklistCard: React.FC<ActiveChecklistCardProps> = ({ checklist, onExecute, onChecklistExecuted }) => {
  const { canExecuteChecklist } = useChecklists();
  const isExecutable = canExecuteChecklist(checklist);

  const handleExecuteClick = () => {
    if (!isExecutable) {
      toast.error("This checklist cannot be executed at this time due to its execution window constraints.");
      return;
    }
    onExecute();
    if (onChecklistExecuted) {
      onChecklistExecuted(checklist);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <CardTitle className="text-lg">{checklist.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExecuteClick}>
                Execute Checklist
              </DropdownMenuItem>
              <DropdownMenuItem>
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                Clone Checklist
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Delete Checklist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {checklist.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm flex justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Start: {format(checklist.startDate, 'MMM d, yyyy')}</span>
              </div>
              {checklist.dueDate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {format(checklist.dueDate, 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
            {checklist.branch && (
              <div className="text-sm flex items-center gap-2">
                <Badge variant="outline">{checklist.branch}</Badge>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{checklist.progress}% ({checklist.completedCount}/{checklist.totalCount})</span>
            </div>
            <Progress value={checklist.progress} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-1 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {checklist.assignedTo?.length || 0} assigned
          </span>
        </div>
        <Badge variant={
          checklist.status === 'completed' ? 'default' : 
          checklist.status === 'in-progress' ? 'secondary' : 
          'outline'
        }>
          {checklist.status === 'in-progress' ? 'In Progress' : 
           checklist.status === 'completed' ? 'Completed' : 'Draft'}
        </Badge>
        <Button 
          size="sm" 
          onClick={handleExecuteClick}
          disabled={!isExecutable}
        >
          Execute
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ActiveChecklistCard;

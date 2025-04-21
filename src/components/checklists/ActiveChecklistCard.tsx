
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checklist } from '@/types/checklist';
import { toast } from '@/components/ui/sonner';

interface ActiveChecklistCardProps {
  checklist: Checklist;
  onExecute?: (checklist: Checklist) => void;
}

const ActiveChecklistCard: React.FC<ActiveChecklistCardProps> = ({ checklist, onExecute }) => {
  const handleExecute = () => {
    if (onExecute) {
      onExecute(checklist);
    } else {
      toast.success(`Executing checklist: ${checklist.title}`);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle>{checklist.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {checklist.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span>{checklist.completedCount} / {checklist.totalCount} items</span>
        </div>
        <Progress value={checklist.progress} className="h-2" />
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{format(new Date(checklist.dueDate || checklist.startDate), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>
              {checklist.status === 'completed'
                ? 'Completed'
                : checklist.status === 'in-progress'
                  ? 'In Progress'
                  : 'Not Started'}
            </span>
          </div>
        </div>
        {checklist.branch && (
          <Badge variant="outline" className="mt-1">
            {checklist.branch}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-3 border-t gap-2">
        <Button variant="default" size="sm">
          View Checklist
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExecute}>
          Execute
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Checklist</DropdownMenuItem>
            <DropdownMenuItem>Download PDF</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

export default ActiveChecklistCard;


import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Checklist } from '@/types/checklist';
import ChecklistExecutionView from './ChecklistExecutionView';
import { useChecklists } from '@/contexts/checklists';

interface ChecklistDetailsProps {
  checklist: Checklist;
}

const ChecklistDetails: React.FC<ChecklistDetailsProps> = ({ checklist }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { fetchChecklists } = useChecklists();
  
  // Handle refresh after checklist is updated
  const handleUpdate = async () => {
    await fetchChecklists();
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{checklist.title}</CardTitle>
              <CardDescription>{checklist.description}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {checklist.branch && (
                <Badge variant="outline">{checklist.branch}</Badge>
              )}
              <Badge variant={
                checklist.status === 'completed' ? 'default' : 
                checklist.status === 'in-progress' ? 'secondary' : 
                'outline'
              }>
                {checklist.status === 'in-progress' ? 'In Progress' : 
                 checklist.status === 'completed' ? 'Completed' : 'Draft'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">Start Date:</span> {format(checklist.startDate, 'PPP')}
            </div>
            {checklist.dueDate && (
              <div>
                <span className="font-medium">Due Date:</span> {format(checklist.dueDate, 'PPP')}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{checklist.progress}% ({checklist.completedCount}/{checklist.totalCount})</span>
            </div>
            <Progress value={checklist.progress} />
          </div>
          
          <ChecklistExecutionView 
            checklist={checklist} 
            onUpdate={handleUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChecklistDetails;

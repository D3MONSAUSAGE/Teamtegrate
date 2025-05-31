
import React from "react";
import { Button } from "@/components/ui/button";
import { DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { CheckCircle2, X } from "lucide-react";

interface TaskDetailFooterProps {
  status: string;
  onStatusChange: (status: 'To Do' | 'In Progress' | 'Done') => void;
}

const TaskDetailFooter: React.FC<TaskDetailFooterProps> = ({ status, onStatusChange }) => {
  return (
    <DrawerFooter className="flex flex-row space-x-2">
      {status !== 'Done' && (
        <Button 
          onClick={() => onStatusChange('Done')} 
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Mark Complete
        </Button>
      )}
      
      {status === 'Done' && (
        <Button
          onClick={() => onStatusChange('To Do')}
          variant="outline"
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          Mark Incomplete
        </Button>
      )}
      
      <DrawerClose asChild>
        <Button variant="outline" className="flex-1">Close</Button>
      </DrawerClose>
    </DrawerFooter>
  );
};

export default TaskDetailFooter;

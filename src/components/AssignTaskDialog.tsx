
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTask } from '@/contexts/TaskContext';
import { Task } from '@/types';
import { Check, Search } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}

// In a real app, this would come from an API
const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Robert Johnson', email: 'robert@example.com' },
  { id: '4', name: 'Emily Davis', email: 'emily@example.com' },
];

const AssignTaskDialog: React.FC<AssignTaskDialogProps> = ({ open, onOpenChange, task }) => {
  const [search, setSearch] = useState('');
  const { assignTaskToUser } = useTask();
  
  const filteredMembers = mockTeamMembers.filter((member) => {
    return (
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
    );
  });
  
  const handleAssign = (memberId: string, memberName: string) => {
    assignTaskToUser(task.id, memberId, memberName);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Task: {task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-2">
          <div className="flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="mt-4 max-h-60 overflow-y-auto">
            <Label className="text-xs text-gray-500 mb-2 block">Select a team member</Label>
            <ul className="space-y-2">
              {filteredMembers.map((member) => (
                <li 
                  key={member.id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer"
                  onClick={() => handleAssign(member.id, member.name)}
                >
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  {task.assignedToId === member.id && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </li>
              ))}
              {filteredMembers.length === 0 && (
                <li className="p-4 text-center text-gray-500">No team members found</li>
              )}
            </ul>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTaskDialog;


import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { Check, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}

const AssignTaskDialog: React.FC<AssignTaskDialogProps> = ({ open, onOpenChange, task }) => {
  const [search, setSearch] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { assignTaskToUser } = useTask();
  
  // Load team members when dialog opens
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!open) return;
      
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*');
          
        if (error) {
          console.error('Error loading team members:', error);
          return;
        }
        
        if (data) {
          setTeamMembers(data.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role
          })));
        }
      } catch (error) {
        console.error('Error loading team members:', error);
      }
    };
    
    // First try from Supabase
    loadTeamMembers();
    
    // Fallback to localStorage if needed
    const storedMembers = localStorage.getItem('teamMembers');
    if (storedMembers) {
      setTeamMembers(prev => {
        if (prev.length === 0) {
          return JSON.parse(storedMembers);
        }
        return prev;
      });
    }
  }, [open]); 
  
  const filteredMembers = teamMembers.filter((member) => {
    return (
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase())
    );
  });
  
  const handleAssign = (memberId: string, memberName: string) => {
    console.log('Assigning task to member:', { memberId, memberName, taskId: task.id });
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
            {teamMembers.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No team members found</p>
                <p className="text-sm mt-2">Add team members in the Team page</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredMembers.map((member) => (
                  <li 
                    key={member.id} 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer"
                    onClick={() => handleAssign(member.id, member.name)}
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center">
                        <p className="text-xs text-gray-500">{member.email}</p>
                        <span className="mx-1 text-gray-300">•</span>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    {task.assigned_to_id === member.id && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </li>
                ))}
                {filteredMembers.length === 0 && (
                  <li className="p-4 text-center text-gray-500">No team members found</li>
                )}
              </ul>
            )}
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

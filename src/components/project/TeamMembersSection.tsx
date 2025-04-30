import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Plus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type FormValues = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  budget?: number; // Changed to just number type and kept it optional
  teamMembers: { memberId: string }[];
};

interface TeamMembersSectionProps {
  teamMembers: any[];
  teamMemberFields: { id: string; memberId: string }[];
  setValue: UseFormSetValue<FormValues>;
  watch: UseFormWatch<FormValues>;
  fieldArrayProps: {
    append: (value: { memberId: string }) => void;
    remove: (index: number) => void;
  };
}

export const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
  teamMembers,
  teamMemberFields,
  setValue,
  watch,
  fieldArrayProps: { append, remove }
}) => {
  const [selectedMember, setSelectedMember] = React.useState<string>('');
  const watchTeamMembers = watch('teamMembers') || [];
  
  const handleAddMember = () => {
    if (selectedMember && !watchTeamMembers.some(m => m.memberId === selectedMember)) {
      append({ memberId: selectedMember });
      setSelectedMember('');
    }
  };

  // Filter out team members that are already selected
  const availableTeamMembers = teamMembers.filter(
    member => !watchTeamMembers.some(m => m.memberId === member.id)
  );

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Team Members</h3>
      
      <div className="flex gap-2">
        <Select 
          value={selectedMember} 
          onValueChange={setSelectedMember}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a team member" />
          </SelectTrigger>
          <SelectContent>
            {availableTeamMembers.map(member => (
              <SelectItem 
                key={member.id} 
                value={member.id}
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(member.name?.[0] || member.email[0] || '').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.name || member.email}</span>
                </div>
              </SelectItem>
            ))}
            
            {availableTeamMembers.length === 0 && (
              <div className="p-2 text-center text-gray-500">
                No available team members
              </div>
            )}
          </SelectContent>
        </Select>
        <Button 
          type="button" 
          onClick={handleAddMember} 
          disabled={!selectedMember}
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      
      <div className="space-y-2">
        {teamMemberFields.map((field, index) => {
          const memberData = teamMembers.find(m => m.id === field.memberId);
          return (
            <div key={field.id} className="flex items-center justify-between p-2 border rounded bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={memberData?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(memberData?.name?.[0] || memberData?.email?.[0] || '').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{memberData?.name || memberData?.email || field.memberId}</span>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => remove(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
        
        {teamMemberFields.length === 0 && (
          <p className="text-sm text-gray-500 p-2 text-center">No team members added yet.</p>
        )}
      </div>
    </div>
  );
};

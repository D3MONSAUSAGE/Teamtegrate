
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

export type FormValues = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string | number;
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

const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
  teamMembers,
  teamMemberFields,
  setValue,
  watch,
  fieldArrayProps: { append, remove }
}) => {
  const [selectedMember, setSelectedMember] = React.useState<string>('');
  const watchTeamMembers = watch('teamMembers') || [];
  
  const handleAddMember = () => {
    if (selectedMember && !watchTeamMembers.find(m => m.memberId === selectedMember)) {
      append({ memberId: selectedMember });
      setSelectedMember('');
    }
  };

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
            {teamMembers.map(member => (
              <SelectItem 
                key={member.id} 
                value={member.id}
                disabled={watchTeamMembers.some(m => m.memberId === member.id)}
              >
                {member.name}
              </SelectItem>
            ))}
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
            <div key={field.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
              <span>{memberData?.name || field.memberId}</span>
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
          <p className="text-sm text-gray-500">No team members added yet.</p>
        )}
      </div>
    </div>
  );
};

export default TeamMembersSection;


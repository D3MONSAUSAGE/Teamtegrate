
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
import { UseFormWatch, UseFormSetValue, FieldArrayWithId } from "react-hook-form";
import { Plus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormValues } from "./EditProjectDialog";

export interface TeamMembersSectionProps {
  teamMembers: any[];
  teamMemberFields: FieldArrayWithId<FormValues, "teamMembers", "id">[];
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
      <h3 className="text-lg font-medium">Team Members</h3>
      <p className="text-sm text-gray-600">Add team members who can view and access this project.</p>
      
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
          // Add type guard to ensure memberId exists
          if (!field.memberId) return null;
          
          const memberData = teamMembers.find(m => m.id === field.memberId);
          return (
            <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={memberData?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(memberData?.name?.[0] || memberData?.email?.[0] || '').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{memberData?.name || memberData?.email || field.memberId}</p>
                  {memberData?.name && memberData?.email && (
                    <p className="text-sm text-gray-500">{memberData.email}</p>
                  )}
                </div>
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
          <div className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500">No team members added yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add team members to give them access to this project.</p>
          </div>
        )}
      </div>
    </div>
  );
};

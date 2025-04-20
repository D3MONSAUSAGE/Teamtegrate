
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash, Plus, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { FormValues } from './ProjectFormTypes';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamMembersSectionProps {
  teamMembers: TeamMember[];
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
  fieldArrayProps
}) => {
  const watchTeamMembers = watch('teamMembers');

  // Filter out team members that are already selected
  const availableTeamMembers = teamMembers.filter(member => {
    return !watchTeamMembers?.some(selected => selected.memberId === member.id);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Label className="text-base font-medium">Team Members</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => fieldArrayProps.append({ memberId: '' })}
          disabled={availableTeamMembers.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Member
        </Button>
      </div>

      {teamMemberFields.length === 0 ? (
        <div className="flex items-center justify-center h-24 bg-muted/30 rounded-md border border-dashed border-muted-foreground/20">
          <div className="flex flex-col items-center text-muted-foreground">
            <Users className="h-8 w-8 mb-2" />
            <p className="text-sm">No team members added yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {teamMemberFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Select
                value={field.memberId}
                onValueChange={(value) => {
                  setValue(`teamMembers.${index}.memberId` as any, value);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers
                    .filter(member => 
                      member.id === field.memberId || 
                      !watchTeamMembers?.some(
                        selected => selected.memberId === member.id
                      )
                    )
                    .map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fieldArrayProps.remove(index)}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamMembersSection;

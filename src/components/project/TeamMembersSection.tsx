
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from 'lucide-react';
import { UseFieldArrayReturn, FieldArrayWithId, UseFormWatch, UseFormSetValue, Path, PathValue } from 'react-hook-form';
import { FormValues } from '../CreateProjectDialog';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  managerId: string;
}

interface TeamMembersSectionProps<TFormValues extends FormValues> {
  teamMembers: TeamMember[];
  teamMemberFields: FieldArrayWithId[];
  setValue: UseFormSetValue<TFormValues>;
  watch: UseFormWatch<TFormValues>;
  fieldArrayProps: {
    append: (value: { memberId: string }) => void;
    remove: (index: number) => void;
  };
}

function TeamMembersSection<TFormValues extends FormValues>({
  teamMembers,
  teamMemberFields,
  setValue,
  watch,
  fieldArrayProps: { append, remove }
}: TeamMembersSectionProps<TFormValues>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Team Members</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => append({ memberId: '' })}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </div>
      
      {teamMemberFields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Select
            onValueChange={(value: string) => {
              setValue(`teamMembers.${index}.memberId` as Path<TFormValues>, value as PathValue<TFormValues, Path<TFormValues>>);
            }}
            value={(watch(`teamMembers.${index}.memberId` as Path<TFormValues>) || '') as string}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={() => remove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export default TeamMembersSection;

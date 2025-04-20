
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from 'lucide-react';
import { UseFieldArrayReturn, FieldValues, FieldArrayWithId, UseFormWatch, UseFormSetValue, Path } from 'react-hook-form';

interface TeamMembersSectionProps<TFieldValues extends FieldValues> {
  teamMembers: any[];
  teamMemberFields: FieldArrayWithId<TFieldValues, "teamMembers", "id">[];
  setValue: UseFormSetValue<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  fieldArrayProps: {
    append: UseFieldArrayReturn<TFieldValues, "teamMembers", "id">["append"];
    remove: UseFieldArrayReturn<TFieldValues, "teamMembers", "id">["remove"];
  };
}

const TeamMembersSection = <TFieldValues extends FieldValues>({
  teamMembers,
  teamMemberFields,
  setValue,
  watch,
  fieldArrayProps: { append, remove }
}: TeamMembersSectionProps<TFieldValues>) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Team Members</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => append({ memberId: '' } as any)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </div>
      
      {teamMemberFields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Select
            onValueChange={(value) => {
              setValue(`teamMembers.${index}.memberId` as unknown as Path<TFieldValues>, value);
            }}
            value={watch(`teamMembers.${index}.memberId` as unknown as Path<TFieldValues>)}
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
};

export default TeamMembersSection;


import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormWatch } from 'react-hook-form';
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamMembersSectionProps<T> {
  teamMembers: Array<{ id: string; name: string }>;
  teamMemberFields: Array<{ id: string; memberId: string }>;
  setValue: (name: string, value: any) => void;
  watch: UseFormWatch<T>;
  fieldArrayProps: {
    append: (value: { memberId: string }) => void;
    remove: (index: number) => void;
  };
}

const TeamMembersSection = <T,>({
  teamMembers,
  teamMemberFields,
  setValue,
  watch,
  fieldArrayProps,
}: TeamMembersSectionProps<T>) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Team Members</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => fieldArrayProps.append({ memberId: '' })}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </div>
      
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-2">
          {teamMemberFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Select
                onValueChange={(value) => setValue(`teamMembers.${index}.memberId`, value)}
                value={watch(`teamMembers.${index}.memberId` as any)}
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
                onClick={() => fieldArrayProps.remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TeamMembersSection;

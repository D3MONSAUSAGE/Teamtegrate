
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

interface NoTeamMembersProps {
  onAddMember: () => void;
}

const NoTeamMembers: React.FC<NoTeamMembersProps> = ({ onAddMember }) => {
  return (
    <Card className="py-8">
      <div className="text-center text-muted-foreground">
        <p>No team members yet. Add your first team member to get started.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onAddMember}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Team Member
        </Button>
      </div>
    </Card>
  );
};

export default NoTeamMembers;

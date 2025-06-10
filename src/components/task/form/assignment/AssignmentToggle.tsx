
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, User } from "lucide-react";

interface AssignmentToggleProps {
  multiAssignMode: boolean;
  onToggle: (enabled: boolean) => void;
}

const AssignmentToggle: React.FC<AssignmentToggleProps> = ({
  multiAssignMode,
  onToggle
}) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          {multiAssignMode ? <Users className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-blue-600" />}
        </div>
        <div>
          <Label htmlFor="multi-assign" className="font-medium">
            Collaborative Task
          </Label>
          <p className="text-xs text-muted-foreground">
            {multiAssignMode ? 'Assign to multiple team members' : 'Assign to a single team member'}
          </p>
        </div>
      </div>
      <Switch
        id="multi-assign"
        checked={multiAssignMode}
        onCheckedChange={onToggle}
      />
    </div>
  );
};

export default AssignmentToggle;

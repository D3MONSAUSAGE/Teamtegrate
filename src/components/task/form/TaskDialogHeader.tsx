
import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Users, User } from "lucide-react";

interface TaskDialogHeaderProps {
  isEditMode: boolean;
  completionPercentage: number;
  multiAssignMode: boolean;
  onMultiAssignToggle: (enabled: boolean) => void;
}

const TaskDialogHeader: React.FC<TaskDialogHeaderProps> = ({
  isEditMode,
  completionPercentage,
  multiAssignMode,
  onMultiAssignToggle
}) => {
  return (
    <DialogHeader className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditMode ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </div>
        <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200">
          {completionPercentage}% Complete
        </Badge>
      </div>
      
      {/* Multi-Assignment Toggle */}
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
          onCheckedChange={onMultiAssignToggle}
        />
      </div>
    </DialogHeader>
  );
};

export default TaskDialogHeader;

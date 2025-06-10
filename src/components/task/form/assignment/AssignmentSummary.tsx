
import React from 'react';
import { UserCheck } from "lucide-react";

interface AssignmentSummaryProps {
  selectedMembersCount: number;
}

const AssignmentSummary: React.FC<AssignmentSummaryProps> = ({
  selectedMembersCount
}) => {
  if (selectedMembersCount === 0) return null;

  return (
    <div className="p-3 bg-gradient-to-r from-green-50/50 to-blue-50/50 rounded-lg border border-green-200/30">
      <div className="flex items-center gap-2 text-sm">
        <UserCheck className="h-4 w-4 text-green-600" />
        <span className="font-medium text-green-700">
          {selectedMembersCount} team member{selectedMembersCount !== 1 ? 's' : ''} assigned
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        All assigned members will receive notifications about this task
      </p>
    </div>
  );
};

export default AssignmentSummary;

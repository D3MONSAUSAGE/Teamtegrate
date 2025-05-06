
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BranchBudgetsHeaderProps {
  onAddBudget: () => void;
}

const BranchBudgetsHeader: React.FC<BranchBudgetsHeaderProps> = ({ onAddBudget }) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 pb-4">
      <h3 className="text-lg font-bold">Branch Budgets</h3>
      <Button size="sm" onClick={onAddBudget} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Budget
      </Button>
    </div>
  );
};

export default BranchBudgetsHeader;

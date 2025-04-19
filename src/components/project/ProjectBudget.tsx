
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProjectBudgetProps {
  budget: number;
  budgetSpent: number;
}

const ProjectBudget: React.FC<ProjectBudgetProps> = ({ budget, budgetSpent }) => {
  const budgetProgress = Math.round((budgetSpent / budget) * 100);

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Budget: ${budget.toLocaleString()}</span>
        <Badge variant="outline" className="ml-1">{budgetProgress}%</Badge>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Spent: ${budgetSpent.toLocaleString()}</span>
      </div>
      <Progress 
        value={budgetProgress} 
        className="h-1.5 md:h-2"
        variant={budgetProgress > 100 ? "destructive" : "default"}
      />
    </div>
  );
};

export default ProjectBudget;


import React from 'react';
import { Progress } from "@/components/ui/progress";

interface ProjectBudgetInfoProps {
  budget: number;
  budgetSpent: number;
}

const ProjectBudgetInfo: React.FC<ProjectBudgetInfoProps> = ({ budget, budgetSpent }) => {
  const percentSpent = Math.round((budgetSpent / budget) * 100);
  
  // Determine the color based on the percentage spent
  let progressColor = "bg-green-600";
  if (percentSpent > 90) {
    progressColor = "bg-red-600";
  } else if (percentSpent > 70) {
    progressColor = "bg-orange-500";
  } else if (percentSpent > 50) {
    progressColor = "bg-yellow-500";
  }

  return (
    <div className="text-sm text-gray-600 mb-4">
      <div className="flex justify-between">
        <span className="font-medium">Budget:</span>
        <span>${budget.toFixed(2)}</span>
      </div>
      
      <div className="space-y-1 mt-2">
        <div className="flex justify-between text-xs">
          <span>Spent: ${budgetSpent.toFixed(2)}</span>
          <span>{percentSpent}%</span>
        </div>
        <Progress 
          value={percentSpent} 
          className="h-2"
          indicatorClassName={progressColor}
        />
      </div>
    </div>
  );
};

export default ProjectBudgetInfo;

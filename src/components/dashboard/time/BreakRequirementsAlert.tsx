
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Coffee } from 'lucide-react';

interface BreakRequirementsAlertProps {
  mealBreaks: number;
  restBreaks: number;
  totalMinutes: number;
}

const BreakRequirementsAlert: React.FC<BreakRequirementsAlertProps> = ({
  mealBreaks,
  restBreaks,
  totalMinutes
}) => {
  return (
    <Alert className="bg-muted">
      <Coffee className="h-4 w-4" />
      <AlertTitle>Required Breaks</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-1 text-sm">
          <p>Meal Breaks (30 min): {mealBreaks} required</p>
          <p>Rest Breaks (10 min): {restBreaks} required</p>
          {totalMinutes > 300 && (
            <p className="text-muted-foreground text-xs mt-1">
              CA Law: 30-min meal break required after 5 hours, additional after 12 hours.
              10-min rest break per 4 hours worked.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default BreakRequirementsAlert;

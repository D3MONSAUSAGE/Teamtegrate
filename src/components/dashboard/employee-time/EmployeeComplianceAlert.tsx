
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Coffee } from 'lucide-react';
import { formatHoursMinutes } from '@/utils/timeUtils';

interface EmployeeComplianceAlertProps {
  complianceNotes?: string;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
}

const EmployeeComplianceAlert: React.FC<EmployeeComplianceAlertProps> = ({
  complianceNotes,
  totalWorkMinutes,
  totalBreakMinutes
}) => {
  if (!complianceNotes) return null;

  const needsMealBreak = totalWorkMinutes > 300 && totalBreakMinutes < 30;
  const needsRestBreak = totalWorkMinutes > 240 && totalBreakMinutes === 0;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <div className="font-medium text-amber-700 dark:text-amber-300 mb-2">
                Labor Law Compliance Alert
              </div>
              <div className="text-sm text-amber-600 dark:text-amber-400">
                {complianceNotes}
              </div>
            </div>

            {(needsMealBreak || needsRestBreak) && (
              <div className="space-y-2">
                <div className="font-medium text-amber-700 dark:text-amber-300">
                  Immediate Actions Required:
                </div>
                
                {needsMealBreak && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <Coffee className="h-4 w-4" />
                    <span>
                      Take a 30-minute meal break (worked {formatHoursMinutes(totalWorkMinutes)}, 
                      only {formatHoursMinutes(totalBreakMinutes)} break time)
                    </span>
                  </div>
                )}
                
                {needsRestBreak && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span>
                      Take a 10-minute rest break (worked {formatHoursMinutes(totalWorkMinutes)} 
                      without breaks)
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-amber-500 dark:text-amber-500 pt-2 border-t border-amber-200 dark:border-amber-800">
              <strong>California Labor Law:</strong> Employees must receive a 30-minute meal break 
              when working more than 5 hours, and a 10-minute rest break for every 4 hours worked.
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EmployeeComplianceAlert;

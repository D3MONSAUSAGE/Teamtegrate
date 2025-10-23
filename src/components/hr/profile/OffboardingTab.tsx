import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOffboarding } from '@/hooks/hr/useOffboarding';
import OffboardingDialog from '../OffboardingDialog';
import OffboardingChecklist from '../OffboardingChecklist';
import { AlertCircle, UserX, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { terminationTypeLabels } from '@/types/offboarding';

interface OffboardingTabProps {
  userId: string;
  userName: string;
}

const OffboardingTab: React.FC<OffboardingTabProps> = ({ userId, userName }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getOffboardingRecord } = useOffboarding();
  const { data: offboardingRecord, isLoading } = getOffboardingRecord(userId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!offboardingRecord) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Employee Offboarding</CardTitle>
            <CardDescription>
              Manage the structured offboarding process for this employee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">No offboarding process initiated</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start the offboarding process to create a structured workflow for termination,
                  access revocation, and ensure all necessary tasks are completed.
                </p>
              </div>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="w-full">
              <UserX className="h-4 w-4 mr-2" />
              Start Offboarding Process
            </Button>
          </CardContent>
        </Card>

        <OffboardingDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          userId={userId}
          userName={userName}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offboarding Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Offboarding Status</CardTitle>
              <CardDescription>Employee termination details and progress</CardDescription>
            </div>
            {offboardingRecord.status === 'completed' ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Badge>
            ) : (
              <Badge variant="secondary">In Progress</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Termination Type</p>
              <p className="font-medium">
                {terminationTypeLabels[offboardingRecord.termination_type]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Termination Date</p>
              <p className="font-medium">
                {format(new Date(offboardingRecord.termination_date), 'PPP')}
              </p>
            </div>
            {offboardingRecord.last_day_worked && (
              <div>
                <p className="text-sm text-muted-foreground">Last Day Worked</p>
                <p className="font-medium">
                  {format(new Date(offboardingRecord.last_day_worked), 'PPP')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Eligible for Rehire</p>
              <p className="font-medium">
                {offboardingRecord.eligible_for_rehire ? (
                  <span className="text-green-600 dark:text-green-400">Yes</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">No</span>
                )}
              </p>
            </div>
          </div>

          {offboardingRecord.termination_reason && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Termination Reason</p>
              <p className="text-sm bg-muted p-3 rounded-md">
                {offboardingRecord.termination_reason}
              </p>
            </div>
          )}

          {offboardingRecord.offboarding_notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Offboarding Notes</p>
              <p className="text-sm bg-muted p-3 rounded-md">
                {offboardingRecord.offboarding_notes}
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Initiated on {format(new Date(offboardingRecord.initiated_at), 'PPP')}
              {offboardingRecord.completed_at &&
                ` • Completed on ${format(new Date(offboardingRecord.completed_at), 'PPP')}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Offboarding Checklist */}
      <OffboardingChecklist
        offboardingRecord={offboardingRecord}
        canEdit={offboardingRecord.status !== 'completed'}
      />
    </div>
  );
};

export default OffboardingTab;

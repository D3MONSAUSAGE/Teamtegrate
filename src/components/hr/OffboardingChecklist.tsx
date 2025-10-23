import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useOffboarding } from '@/hooks/hr/useOffboarding';
import { OffboardingRecord } from '@/types/offboarding';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface OffboardingChecklistProps {
  offboardingRecord: OffboardingRecord;
  canEdit: boolean;
}

const OffboardingChecklist: React.FC<OffboardingChecklistProps> = ({
  offboardingRecord,
  canEdit,
}) => {
  const { updateChecklist, completeOffboarding, revokeAccess } = useOffboarding();
  const [equipmentNotes, setEquipmentNotes] = useState(offboardingRecord.equipment_notes || '');
  const [exitInterviewNotes, setExitInterviewNotes] = useState(offboardingRecord.exit_interview_notes || '');

  const handleChecklistUpdate = async (field: string, value: boolean, notes?: string) => {
    const updates: any = { [field]: value };
    if (notes !== undefined) {
      updates[`${field.replace('_completed', '').replace('_returned', '').replace('_processed', '')}_notes`] = notes;
    }
    await updateChecklist.mutateAsync({
      offboardingId: offboardingRecord.id,
      updates,
    });
  };

  const handleCompleteOffboarding = async () => {
    if (!isReadyToComplete) {
      return;
    }
    await completeOffboarding.mutateAsync(offboardingRecord.id);
  };

  const handleRevokeAccess = async () => {
    if (confirm('Are you sure you want to revoke access immediately? This action cannot be undone.')) {
      await revokeAccess.mutateAsync(offboardingRecord.user_id);
    }
  };

  const isReadyToComplete =
    offboardingRecord.access_revoked &&
    offboardingRecord.equipment_returned &&
    offboardingRecord.exit_interview_completed &&
    offboardingRecord.final_payroll_processed;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Offboarding Checklist</CardTitle>
            <CardDescription>
              Complete all tasks before finalizing the offboarding process
            </CardDescription>
          </div>
          {offboardingRecord.status === 'completed' ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              In Progress
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Access Revocation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={offboardingRecord.access_revoked}
                disabled
                id="access_revoked"
              />
              <div>
                <Label htmlFor="access_revoked" className="text-base font-medium cursor-pointer">
                  Platform Access Revoked
                </Label>
                <p className="text-sm text-muted-foreground">
                  {offboardingRecord.access_revoked
                    ? `Revoked on ${format(new Date(offboardingRecord.access_revoked_at!), 'PPP')}`
                    : 'Employee can still access the platform'}
                </p>
              </div>
            </div>
            {!offboardingRecord.access_revoked && canEdit && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAccess}
                disabled={revokeAccess.isPending}
              >
                Revoke Now
              </Button>
            )}
          </div>
          {!offboardingRecord.access_revoked && (
            <div className="ml-8 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Access will be automatically revoked on the last day worked if not done manually
              </p>
            </div>
          )}
        </div>

        {/* Equipment Return */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={offboardingRecord.equipment_returned}
              onCheckedChange={(checked) =>
                handleChecklistUpdate('equipment_returned', checked as boolean, equipmentNotes)
              }
              disabled={!canEdit || offboardingRecord.status === 'completed'}
              id="equipment_returned"
            />
            <Label htmlFor="equipment_returned" className="text-base font-medium cursor-pointer">
              Equipment Returned
            </Label>
          </div>
          {canEdit && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="equipment_notes" className="text-sm">Notes</Label>
              <Textarea
                id="equipment_notes"
                placeholder="List equipment returned (laptop, phone, badges, etc.)"
                value={equipmentNotes}
                onChange={(e) => setEquipmentNotes(e.target.value)}
                onBlur={() => {
                  if (equipmentNotes !== offboardingRecord.equipment_notes) {
                    handleChecklistUpdate('equipment_returned', offboardingRecord.equipment_returned, equipmentNotes);
                  }
                }}
                disabled={offboardingRecord.status === 'completed'}
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        {/* Exit Interview */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={offboardingRecord.exit_interview_completed}
              onCheckedChange={(checked) =>
                handleChecklistUpdate('exit_interview_completed', checked as boolean, exitInterviewNotes)
              }
              disabled={!canEdit || offboardingRecord.status === 'completed'}
              id="exit_interview"
            />
            <Label htmlFor="exit_interview" className="text-base font-medium cursor-pointer">
              Exit Interview Completed
            </Label>
          </div>
          {canEdit && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="exit_interview_notes" className="text-sm">Interview Summary</Label>
              <Textarea
                id="exit_interview_notes"
                placeholder="Key takeaways from exit interview..."
                value={exitInterviewNotes}
                onChange={(e) => setExitInterviewNotes(e.target.value)}
                onBlur={() => {
                  if (exitInterviewNotes !== offboardingRecord.exit_interview_notes) {
                    handleChecklistUpdate('exit_interview_completed', offboardingRecord.exit_interview_completed, exitInterviewNotes);
                  }
                }}
                disabled={offboardingRecord.status === 'completed'}
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        {/* Final Payroll */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={offboardingRecord.final_payroll_processed}
              onCheckedChange={(checked) =>
                handleChecklistUpdate('final_payroll_processed', checked as boolean)
              }
              disabled={!canEdit || offboardingRecord.status === 'completed'}
              id="final_payroll"
            />
            <Label htmlFor="final_payroll" className="text-base font-medium cursor-pointer">
              Final Payroll Processed
            </Label>
          </div>
        </div>

        {/* Complete Button */}
        {canEdit && offboardingRecord.status !== 'completed' && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleCompleteOffboarding}
              disabled={!isReadyToComplete || completeOffboarding.isPending}
              className="w-full"
            >
              {completeOffboarding.isPending ? 'Completing...' : 'Complete Offboarding Process'}
            </Button>
            {!isReadyToComplete && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                All checklist items must be completed before finalizing
              </p>
            )}
          </div>
        )}

        {offboardingRecord.status === 'completed' && offboardingRecord.completed_at && (
          <div className="pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Offboarding completed on {format(new Date(offboardingRecord.completed_at), 'PPP')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OffboardingChecklist;

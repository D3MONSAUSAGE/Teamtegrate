import React from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CorrectionRequestStatusBadge } from './CorrectionRequestStatusBadge';
import { useTimeEntryCorrectionRequests } from '@/hooks/useTimeEntryCorrectionRequests';

export const MyCorrectionRequestsView: React.FC = () => {
  const { myRequests, corrections, isLoading } = useTimeEntryCorrectionRequests();

  if (isLoading) {
    return <div className="text-center p-4">Loading your correction requests...</div>;
  }

  if (myRequests.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">You haven't submitted any time entry correction requests.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">My Correction Requests</h2>
      
      {myRequests.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                Request #{request.id.slice(0, 8)}
              </span>
              <CorrectionRequestStatusBadge status={request.status} />
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(request.created_at), 'PPP')}
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Reason: </span>
              <span className="text-sm">{request.employee_reason}</span>
            </div>

            {request.manager_notes && (
              <div>
                <span className="text-sm font-medium">Manager Notes: </span>
                <span className="text-sm">{request.manager_notes}</span>
              </div>
            )}

            {request.admin_notes && (
              <div>
                <span className="text-sm font-medium">Admin Notes: </span>
                <span className="text-sm">{request.admin_notes}</span>
              </div>
            )}

            {corrections[request.id] && (
              <>
                <Separator className="my-3" />
                <div>
                  <span className="text-sm font-medium">
                    Time Entries ({corrections[request.id].length}):
                  </span>
                  <div className="mt-2 space-y-2">
                    {corrections[request.id].map((correction) => (
                      <div key={correction.id} className="text-xs bg-muted p-2 rounded">
                        <div>Entry ID: {correction.time_entry_id.slice(0, 8)}</div>
                        {correction.corrected_clock_in && (
                          <div>Clock In: {format(new Date(correction.corrected_clock_in), 'PPp')}</div>
                        )}
                        {correction.corrected_clock_out && (
                          <div>Clock Out: {format(new Date(correction.corrected_clock_out), 'PPp')}</div>
                        )}
                        {correction.corrected_notes && (
                          <div>Notes: {correction.corrected_notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Plus, Building } from 'lucide-react';
import { format } from 'date-fns';
import { useRecruitmentReferences } from '@/hooks/recruitment/useRecruitmentReferences';
import { AddReferenceDialog } from './AddReferenceDialog';
import type { CandidateWithDetails } from '@/types/recruitment';

interface CandidateReferencesTabProps {
  candidate: CandidateWithDetails;
}

export function CandidateReferencesTab({ candidate }: CandidateReferencesTabProps) {
  const { references, isLoading } = useRecruitmentReferences(candidate.id);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-green-500';
      case 'voicemail':
        return 'bg-yellow-500';
      case 'no_answer':
        return 'bg-orange-500';
      case 'invalid_number':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'positive':
        return 'bg-green-500';
      case 'neutral':
        return 'bg-yellow-500';
      case 'negative':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading references...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Reference Checks</h3>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reference
        </Button>
      </div>

      {references.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No references added</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Reference
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {references.map((ref) => (
            <Card key={ref.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{ref.reference_name}</CardTitle>
                      <Badge className={getCallStatusColor(ref.call_status)}>
                        {ref.call_status}
                      </Badge>
                      {ref.overall_rating && (
                        <Badge className={getRatingColor(ref.overall_rating)}>
                          {ref.overall_rating}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <p>Relationship: {ref.relationship}</p>
                      {ref.company && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {ref.company}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {ref.phone_number}
                      </div>
                      {ref.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {ref.email}
                        </div>
                      )}
                    </div>

                    {ref.call_date && (
                      <p className="text-sm text-muted-foreground">
                        Called on {format(new Date(ref.call_date), 'PPP')}
                        {ref.call_duration_minutes && ` (${ref.call_duration_minutes} min)`}
                      </p>
                    )}

                    {ref.reference_feedback && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Feedback</p>
                        <p className="text-sm">{ref.reference_feedback}</p>
                      </div>
                    )}

                    {ref.would_rehire !== null && (
                      <p className="text-sm">
                        <span className="font-medium">Would rehire:</span> {ref.would_rehire ? 'Yes' : 'No'}
                      </p>
                    )}

                    {ref.notes && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Notes</p>
                        <p className="text-sm">{ref.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <AddReferenceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        candidateId={candidate.id}
      />
    </div>
  );
}

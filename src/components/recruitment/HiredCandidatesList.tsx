import React from 'react';
import { useRecruitmentCandidates } from '@/hooks/recruitment/useRecruitmentCandidates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, CheckCircle, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface HiredCandidatesListProps {
  onCandidateClick?: (candidateId: string) => void;
}

export const HiredCandidatesList: React.FC<HiredCandidatesListProps> = ({ 
  onCandidateClick 
}) => {
  const { candidates, isLoading } = useRecruitmentCandidates({ status: 'hired' });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hired Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hired Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hired candidates yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hired Candidates ({candidates.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => onCandidateClick?.(candidate.id)}
              className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              {/* Header: Avatar + Name + Status Badge */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback>
                    {getInitials(candidate.first_name, candidate.last_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1">
                    {candidate.first_name} {candidate.last_name}
                  </h3>
                  <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1 w-fit">
                    <CheckCircle className="h-3 w-3" />
                    Hired
                  </Badge>
                </div>
              </div>

              {/* Position & Department */}
              {candidate.position && (
                <p className="text-sm text-muted-foreground mb-3">
                  {candidate.position.job_title}
                  {candidate.position.department && ` • ${candidate.position.department}`}
                </p>
              )}

              {/* Contact Info */}
              <div className="space-y-2 mb-3">
                {candidate.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
              </div>

              {/* Footer: Source + Timestamp */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                {candidate.source && (
                  <Badge variant="outline" className="text-xs">
                    {candidate.source}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  Hired {candidate.updated_at && formatDistanceToNow(new Date(candidate.updated_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

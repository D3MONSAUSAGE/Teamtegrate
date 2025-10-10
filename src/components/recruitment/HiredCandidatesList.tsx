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
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {getInitials(candidate.first_name, candidate.last_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">
                    {candidate.first_name} {candidate.last_name}
                  </h3>
                  <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Hired
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground truncate mb-2">
                  {candidate.position?.job_title} • {candidate.position?.department}
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {candidate.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {candidate.email}
                    </span>
                  )}
                  {candidate.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {candidate.phone}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {candidate.source}
                  </Badge>
                </div>
              </div>

              <div className="text-right text-sm text-muted-foreground">
                <div className="text-xs">
                  Hired {candidate.updated_at && formatDistanceToNow(new Date(candidate.updated_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

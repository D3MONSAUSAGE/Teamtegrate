import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Briefcase, Star } from 'lucide-react';
import { format } from 'date-fns';
import type { CandidateWithDetails } from '@/types/recruitment';

interface CandidateOverviewTabProps {
  candidate: CandidateWithDetails;
}

export function CandidateOverviewTab({ candidate }: CandidateOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{candidate.first_name} {candidate.last_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{candidate.email}</p>
          </div>
          {candidate.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{candidate.phone}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Source</p>
            <Badge variant="outline">{candidate.source}</Badge>
          </div>
          {candidate.source_details && (
            <div>
              <p className="text-sm text-muted-foreground">Source Details</p>
              <p className="font-medium">{candidate.source_details}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Position</p>
              <p className="font-medium">{candidate.position?.job_title}</p>
            </div>
          </div>
          {candidate.position?.department && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{candidate.position.department}</p>
              </div>
            </div>
          )}
          {candidate.position?.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{candidate.position.location}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Applied Date</p>
              <p className="font-medium">{format(new Date(candidate.applied_date), 'PPP')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Stage</CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.current_stage ? (
            <div>
              <Badge
                style={{ backgroundColor: candidate.current_stage.color_code }}
                className="mb-2"
              >
                {candidate.current_stage.stage_name}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Stage order: {candidate.current_stage.stage_order}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No stage assigned</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating</CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.overall_rating ? (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{candidate.overall_rating}</span>
              <span className="text-muted-foreground">/ 5</span>
            </div>
          ) : (
            <p className="text-muted-foreground">No rating yet</p>
          )}
        </CardContent>
      </Card>

      {(candidate.resume_url || candidate.cover_letter_url) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            {candidate.resume_url && (
              <a
                href={candidate.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Resume
              </a>
            )}
            {candidate.cover_letter_url && (
              <a
                href={candidate.cover_letter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Cover Letter
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Briefcase, DollarSign, Calendar, Users } from 'lucide-react';
import type { RecruitmentPosition } from '@/types/recruitment';
import { format } from 'date-fns';

interface PositionCardProps {
  position: RecruitmentPosition;
  onViewCandidates?: (positionId: string) => void;
}

const employmentTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  temporary: 'Temporary',
};

const statusColors = {
  open: 'bg-green-500/10 text-green-500',
  closed: 'bg-gray-500/10 text-gray-500',
  on_hold: 'bg-yellow-500/10 text-yellow-500',
};

export function PositionCard({ position, onViewCandidates }: PositionCardProps) {
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max.toLocaleString()}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{position.job_title}</CardTitle>
            {position.department && (
              <p className="text-sm text-muted-foreground mt-1">{position.department}</p>
            )}
          </div>
          <Badge className={statusColors[position.status]}>
            {position.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span>{employmentTypeLabels[position.employment_type]}</span>
          </div>
          {position.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{position.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>{formatSalary(position.salary_range_min, position.salary_range_max)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Posted {format(new Date(position.posted_date), 'MMM d, yyyy')}</span>
          </div>
          {position.target_hire_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Target: {format(new Date(position.target_hire_date), 'MMM d')}</span>
            </div>
          )}
        </div>

        {onViewCandidates && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => onViewCandidates(position.id)}
          >
            <Users className="w-4 h-4 mr-2" />
            View Candidates
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

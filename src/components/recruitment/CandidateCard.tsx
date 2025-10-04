import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, Calendar, Star } from 'lucide-react';
import type { RecruitmentCandidate } from '@/types/recruitment';
import { format } from 'date-fns';

interface CandidateCardProps {
  candidate: RecruitmentCandidate & {
    position?: { job_title: string };
    current_stage?: { stage_name: string; color_code: string };
  };
  isDragging?: boolean;
  onClick?: () => void;
}

const sourceLabels = {
  indeed: 'Indeed',
  linkedin: 'LinkedIn',
  referral: 'Referral',
  direct: 'Direct Apply',
  other: 'Other',
};

const statusColors = {
  active: 'bg-green-500/10 text-green-500',
  hired: 'bg-blue-500/10 text-blue-500',
  rejected: 'bg-red-500/10 text-red-500',
  withdrawn: 'bg-gray-500/10 text-gray-500',
};

export function CandidateCard({ candidate, isDragging, onClick }: CandidateCardProps) {
  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase();

  return (
    <Card 
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        isDragging ? 'shadow-lg rotate-2' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">
              {candidate.first_name} {candidate.last_name}
            </h4>
            {candidate.position && (
              <p className="text-xs text-muted-foreground truncate">
                {candidate.position.job_title}
              </p>
            )}
          </div>
          <Badge className={statusColors[candidate.status]} variant="secondary">
            {candidate.status}
          </Badge>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </div>
          {candidate.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{candidate.phone}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(candidate.applied_date), 'MMM d')}</span>
          </div>
          {candidate.overall_rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-3 h-3 fill-current" />
              <span>{candidate.overall_rating.toFixed(1)}</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {sourceLabels[candidate.source]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

import { Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RequestType, REQUEST_CATEGORIES } from '@/types/requests';
import { cn } from '@/lib/utils';
import { categoryIcons, categoryColors } from '@/utils/categoryConfig';

interface RequestTypeCardProps {
  requestType: RequestType;
  onClick: () => void;
  isSelected?: boolean;
}

export default function RequestTypeCard({ requestType, onClick, isSelected = false }: RequestTypeCardProps) {
  const IconComponent = categoryIcons[requestType.category as keyof typeof categoryIcons] || CheckCircle;
  const colorClass = categoryColors[requestType.category as keyof typeof categoryColors] || categoryColors.custom;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br border-2",
        colorClass,
        isSelected && "ring-2 ring-primary shadow-lg scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg bg-background/50 border",
              isSelected && "bg-primary/10 border-primary/20"
            )}>
              <IconComponent className={cn(
                "h-5 w-5",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold leading-tight">
                {requestType.name}
              </CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                {REQUEST_CATEGORIES[requestType.category as keyof typeof REQUEST_CATEGORIES]}
              </Badge>
            </div>
          </div>
          {requestType.requires_approval && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Approval Required</span>
            </div>
          )}
        </div>
      </CardHeader>
      {requestType.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {requestType.description}
          </p>
          {requestType.form_schema && requestType.form_schema.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {requestType.form_schema.length} additional field{requestType.form_schema.length !== 1 ? 's' : ''} required
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
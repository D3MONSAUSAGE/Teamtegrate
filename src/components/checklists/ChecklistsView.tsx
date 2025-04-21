import React, { useState } from 'react';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Copy, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checklist, ChecklistTemplate } from '@/types/checklist';
import { useChecklists } from '@/contexts/checklists';
import UseTemplateDialog from './UseTemplateDialog';
import WeekSelector from './WeekSelector';
import ActiveChecklistCard from './ActiveChecklistCard';
import TemplateChecklistCard from './TemplateChecklistCard';

interface ChecklistsViewProps {
  type: 'active' | 'template';
}

const ChecklistsView: React.FC<ChecklistsViewProps> = ({ type }) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const { checklists, templates } = useChecklists();
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [isUseTemplateDialogOpen, setIsUseTemplateDialogOpen] = useState(false);

  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  let data = type === 'template' ? templates : checklists;

  if (type === 'active') {
    const activeChecklists = data as Checklist[];
    data = activeChecklists.filter(item => {
      const start = item.startDate;
      const end = item.dueDate || item.startDate;
      return (
        isWithinInterval(start, { start: weekStart, end: weekEnd }) ||
        (item.dueDate && isWithinInterval(end, { start: weekStart, end: weekEnd }))
      );
    });
  }

  const handleUseTemplate = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setIsUseTemplateDialogOpen(true);
  };

  const goToPrevWeek = () => setWeekStart(addWeeks(weekStart, -1));
  const goToNextWeek = () => setWeekStart(addWeeks(weekStart, 1));

  if (data.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">
          {type === 'template' ? 'No templates found' : 'No checklists found'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {type === 'template'
            ? 'Create a template to get started'
            : 'Create a checklist to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {type === 'active' && (
        <WeekSelector
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          goToPrevWeek={goToPrevWeek}
          goToNextWeek={goToNextWeek}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {type === 'active'
          ? (data as Checklist[]).map(item => (
              <ActiveChecklistCard key={item.id} checklist={item} />
            ))
          : (data as ChecklistTemplate[]).map(item => (
              <TemplateChecklistCard
                key={item.id}
                template={item}
                onUseTemplate={handleUseTemplate}
              />
            ))}
      </div>
      <UseTemplateDialog
        open={isUseTemplateDialogOpen}
        onOpenChange={setIsUseTemplateDialogOpen}
        template={selectedTemplate}
      />
    </div>
  );
};

export default ChecklistsView;

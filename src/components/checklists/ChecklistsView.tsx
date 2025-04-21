import React, { useState, useMemo } from 'react';
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
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';

interface ChecklistsViewProps {
  type: 'active' | 'template';
}

const ChecklistsView: React.FC<ChecklistsViewProps> = ({ type }) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const { checklists, templates } = useChecklists();
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [isUseTemplateDialogOpen, setIsUseTemplateDialogOpen] = useState(false);
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const availableBranches = useMemo(() => {
    if (type !== 'active') return [];
    const branches = new Set<string>();
    (checklists as Checklist[]).forEach((item) => {
      if (item.branch) branches.add(item.branch);
    });
    return Array.from(branches);
  }, [type, checklists]);
  
  let data = type === 'template' ? templates : checklists;

  if (type === 'active') {
    let activeChecklists: Checklist[] = data as Checklist[];
    activeChecklists = activeChecklists.filter(item => {
      const start = item.startDate;
      const end = item.dueDate || item.startDate;
      return (
        isWithinInterval(start, { start: weekStart, end: weekEnd }) ||
        (item.dueDate && isWithinInterval(end, { start: weekStart, end: weekEnd }))
      );
    });
    if (selectedBranch !== 'all') {
      activeChecklists = activeChecklists.filter(item => item.branch === selectedBranch);
    }
    data = activeChecklists;
  }

  const handleUseTemplate = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setIsUseTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: ChecklistTemplate) => {
    setEditingTemplate(template);
    setIsEditTemplateDialogOpen(true);
  };

  const handleExecuteChecklist = (checklist: Checklist) => {
    // You may want to handle navigation or advanced logic here.
    // For now, just show a toast (already handled in ActiveChecklistCard's default).
    // This function is available if you want to override, or extend, the default behavior.
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <WeekSelector
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            goToPrevWeek={goToPrevWeek}
            goToNextWeek={goToNextWeek}
          />
          {availableBranches.length > 0 && (
            <div className="w-full md:w-[200px]">
              <Select
                value={selectedBranch}
                onValueChange={setSelectedBranch}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">All Branches</SelectItem>
                  {availableBranches.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {type === 'active'
          ? (data as Checklist[]).map(item => (
              <ActiveChecklistCard
                key={item.id}
                checklist={item}
                onExecute={handleExecuteChecklist}
              />
            ))
          : (data as ChecklistTemplate[]).map(item => (
              <TemplateChecklistCard
                key={item.id}
                template={item}
                onUseTemplate={handleUseTemplate}
                onEditTemplate={handleEditTemplate}
              />
            ))}
      </div>
      <UseTemplateDialog
        open={isUseTemplateDialogOpen}
        onOpenChange={setIsUseTemplateDialogOpen}
        template={selectedTemplate}
      />
      {type === 'template' && (
        <CreateChecklistDialog
          open={isEditTemplateDialogOpen}
          onOpenChange={open => {
            setIsEditTemplateDialogOpen(open);
            if (!open) setEditingTemplate(null);
          }}
          editingTemplate={editingTemplate ?? undefined}
        />
      )}
    </div>
  );
};

export default ChecklistsView;


import React, { useState } from 'react';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Copy, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
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

interface ChecklistsViewProps {
  type: 'active' | 'template';
}

const ChecklistsView: React.FC<ChecklistsViewProps> = ({ type }) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const { checklists, templates } = useChecklists();
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [isUseTemplateDialogOpen, setIsUseTemplateDialogOpen] = useState(false);
  
  const data = type === 'template' ? templates : checklists;

  const handleUseTemplate = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setIsUseTemplateDialogOpen(true);
  };
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle>{item.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {item.description || 'No description provided'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {type === 'active' && item && 'progress' in item && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{item.completedCount} / {item.totalCount} items</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{format(new Date(item.dueDate || item.startDate), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>
                        {item.status === 'completed' 
                          ? 'Completed' 
                          : item.status === 'in-progress' 
                            ? 'In Progress' 
                            : 'Not Started'}
                      </span>
                    </div>
                  </div>
                  
                  {item.branch && (
                    <Badge variant="outline" className="mt-1">
                      {item.branch}
                    </Badge>
                  )}
                </>
              )}
              
              {type === 'template' && item && 'frequency' in item && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="capitalize">{item.frequency} checklist</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Items: {item.sections.reduce((acc, section) => acc + section.items.length, 0)}</span>
                  </div>
                  
                  {item.branchOptions && item.branchOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.branchOptions.slice(0, 2).map(branch => (
                        <Badge key={branch} variant="outline">{branch}</Badge>
                      ))}
                      {item.branchOptions.length > 2 && (
                        <Badge variant="outline">+{item.branchOptions.length - 2} more</Badge>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between pt-3 border-t">
              {type === 'template' ? (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => handleUseTemplate(item as ChecklistTemplate)}
                >
                  Use Template
                </Button>
              ) : (
                <Button variant="default" size="sm">
                  View Checklist
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {type === 'template' ? (
                    <>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit Template</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem>Edit Checklist</DropdownMenuItem>
                      <DropdownMenuItem>Download PDF</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
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

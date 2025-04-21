
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Copy, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChecklistTemplate } from '@/types/checklist';

interface TemplateChecklistCardProps {
  template: ChecklistTemplate;
  onUseTemplate: (template: ChecklistTemplate) => void;
}

const TemplateChecklistCard: React.FC<TemplateChecklistCardProps> = ({ template, onUseTemplate }) => (
  <Card className="overflow-hidden hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <CardTitle>{template.title}</CardTitle>
      <CardDescription className="line-clamp-2">
        {template.description || 'No description provided'}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="capitalize">{template.frequency ? `${template.frequency} checklist` : ''}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Items: {template.sections.reduce((acc, section) => acc + section.items.length, 0)}</span>
      </div>
      {template.branchOptions && template.branchOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {template.branchOptions.slice(0, 2).map(branch => (
            <Badge key={branch} variant="outline">{branch}</Badge>
          ))}
          {template.branchOptions.length > 2 && (
            <Badge variant="outline">+{template.branchOptions.length - 2} more</Badge>
          )}
        </div>
      )}
    </CardContent>
    <CardFooter className="flex justify-between pt-3 border-t">
      <Button
        variant="default"
        size="sm"
        onClick={() => onUseTemplate(template)}
      >
        Use Template
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Copy className="h-4 w-4 mr-2" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem>Edit Template</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardFooter>
  </Card>
);

export default TemplateChecklistCard;

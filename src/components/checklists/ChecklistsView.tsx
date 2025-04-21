
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

// Mock data - in reality this would come from your API/database
const mockChecklists: Checklist[] = [
  {
    id: '1',
    title: 'Store Opening Procedure',
    description: 'Daily checklist for opening the store',
    sections: [
      {
        id: 's1',
        title: 'Security',
        items: [
          { id: 'i1', text: 'Disarm security system', status: 'completed' },
          { id: 'i2', text: 'Check all emergency exits', status: 'completed' },
          { id: 'i3', text: 'Test alarm system', status: 'pending' },
        ]
      },
      {
        id: 's2',
        title: 'Preparation',
        items: [
          { id: 'i4', text: 'Turn on all lights', status: 'completed' },
          { id: 'i5', text: 'Count starting cash', status: 'pending' },
          { id: 'i6', text: 'Prepare POS system', status: 'pending' },
        ]
      }
    ],
    createdBy: 'user-1',
    createdAt: new Date('2025-04-19'),
    assignedTo: ['user-1', 'user-2'],
    startDate: new Date('2025-04-20'),
    dueDate: new Date('2025-04-20'),
    status: 'in-progress',
    progress: 50,
    completedCount: 3,
    totalCount: 6,
    branch: 'Main Street Branch'
  },
  {
    id: '2',
    title: 'Weekly Equipment Inspection',
    description: 'Safety check of all equipment',
    sections: [
      {
        id: 's1',
        title: 'Safety Equipment',
        items: [
          { id: 'i1', text: 'Check fire extinguishers', status: 'completed' },
          { id: 'i2', text: 'Inspect first aid kits', status: 'completed' },
          { id: 'i3', text: 'Test emergency lighting', status: 'completed' },
        ]
      },
      {
        id: 's2',
        title: 'Operations Equipment',
        items: [
          { id: 'i4', text: 'Check refrigeration units', status: 'completed' },
          { id: 'i5', text: 'Inspect POS terminals', status: 'completed' },
          { id: 'i6', text: 'Test backup power', status: 'completed' },
        ]
      }
    ],
    createdBy: 'user-1',
    createdAt: new Date('2025-04-15'),
    assignedTo: ['user-3'],
    startDate: new Date('2025-04-18'),
    dueDate: new Date('2025-04-19'),
    status: 'completed',
    progress: 100,
    completedCount: 6,
    totalCount: 6,
    branch: 'Downtown Branch'
  }
];

const mockTemplates: ChecklistTemplate[] = [
  {
    id: '1',
    title: 'Store Opening Template',
    description: 'Template for daily store opening procedures',
    sections: [
      {
        id: 's1',
        title: 'Security',
        items: [
          { id: 'i1', text: 'Disarm security system', status: 'pending' },
          { id: 'i2', text: 'Check all emergency exits', status: 'pending' },
          { id: 'i3', text: 'Test alarm system', status: 'pending' },
        ]
      },
      {
        id: 's2',
        title: 'Preparation',
        items: [
          { id: 'i4', text: 'Turn on all lights', status: 'pending' },
          { id: 'i5', text: 'Count starting cash', status: 'pending' },
          { id: 'i6', text: 'Prepare POS system', status: 'pending' },
        ]
      }
    ],
    createdBy: 'user-1',
    createdAt: new Date('2025-03-15'),
    branchOptions: ['Main Street Branch', 'Downtown Branch', 'Mall Location'],
    frequency: 'daily'
  },
  {
    id: '2',
    title: 'Weekly Equipment Inspection',
    description: 'Template for safety checks of all store equipment',
    sections: [
      {
        id: 's1',
        title: 'Safety Equipment',
        items: [
          { id: 'i1', text: 'Check fire extinguishers', status: 'pending' },
          { id: 'i2', text: 'Inspect first aid kits', status: 'pending' },
          { id: 'i3', text: 'Test emergency lighting', status: 'pending', requiredPhoto: true },
        ]
      },
      {
        id: 's2',
        title: 'Operations Equipment',
        items: [
          { id: 'i4', text: 'Check refrigeration units', status: 'pending' },
          { id: 'i5', text: 'Inspect POS terminals', status: 'pending' },
          { id: 'i6', text: 'Test backup power', status: 'pending', requiredPhoto: true },
        ]
      }
    ],
    createdBy: 'user-1',
    createdAt: new Date('2025-03-20'),
    branchOptions: ['Main Street Branch', 'Downtown Branch', 'Mall Location'],
    frequency: 'weekly'
  }
];

interface ChecklistsViewProps {
  type: 'active' | 'template';
}

const ChecklistsView: React.FC<ChecklistsViewProps> = ({ type }) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  
  const data = type === 'template' ? mockTemplates : mockChecklists;
  
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
              <Button variant="default" size="sm">
                {type === 'template' ? 'Use Template' : 'View Checklist'}
              </Button>
              
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
    </div>
  );
};

export default ChecklistsView;

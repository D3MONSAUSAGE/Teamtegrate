import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useInventory } from '@/contexts/inventory';
import { InventoryTemplate } from '@/contexts/inventory/types';
import { Search, Package, Users, Play } from 'lucide-react';

interface TemplateCountSelectionDialogProps {
  children: React.ReactNode;
  onStartCount: (template: InventoryTemplate) => void;
}

export const TemplateCountSelectionDialog: React.FC<TemplateCountSelectionDialogProps> = ({
  children,
  onStartCount,
}) => {
  const { templates, teamAssignments } = useInventory();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter templates assigned to user's teams or created by user
  const availableTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Show templates assigned to user's teams or templates they created
    const isAssignedOrOwned = teamAssignments.some(assignment => 
      assignment.template_id === template.id
    ) || template.created_by === 'current_user'; // This would be replaced with actual user ID logic
    
    return matchesSearch && isAssignedOrOwned;
  });

  const handleStartCount = (template: InventoryTemplate) => {
    onStartCount(template);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Template for Count
          </DialogTitle>
          <DialogDescription>
            Choose an inventory template to start counting. You can only count templates assigned to your team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {availableTemplates.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No templates match your search' : 'No templates assigned to your team'}
                </p>
              </div>
            ) : (
              availableTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {template.name}
                      <Badge variant="outline">
                        Template
                      </Badge>
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Items
                      </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {teamAssignments.filter(a => a.template_id === template.id).length} teams
                        </span>
                      </div>
                      
                      <Button 
                        onClick={() => handleStartCount(template)}
                        className="w-full"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Count
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
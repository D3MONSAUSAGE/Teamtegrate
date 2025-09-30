import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useChecklistTemplatesV2, useToggleTemplateStatus, useDeleteChecklistTemplateV2 } from '@/hooks/useChecklistTemplatesV2';
import { ChecklistCreationDialog } from './ChecklistCreationDialog';
import { ChecklistEditDialog } from './ChecklistEditDialog';
import { Checklist } from '@/types/checklist';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, Edit, MoreVertical, Users, Clock, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const ChecklistManagementTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingChecklistId, setDeletingChecklistId] = useState<string | null>(null);

  const { data: templates, isLoading } = useChecklistTemplatesV2();
  const toggleStatus = useToggleTemplateStatus();
  const deleteTemplate = useDeleteChecklistTemplateV2();

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && template.is_active) ||
      (statusFilter === 'inactive' && !template.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatus.mutate({ id, is_active: !currentStatus });
  };

  const handleEditTemplate = (id: string) => {
    setEditingChecklistId(id);
    setEditDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    setDeletingChecklistId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (deletingChecklistId) {
      deleteTemplate.mutate(deletingChecklistId);
      setDeleteDialogOpen(false);
      setDeletingChecklistId(null);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search checklists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Checklist
        </Button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTemplates?.length || 0} of {templates?.length || 0} templates
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates?.map((template) => (
          <Card 
            key={template.id} 
            className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/20 hover:-translate-y-1"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {template.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "shadow-sm transition-all duration-200",
                        getStatusColor(template.is_active)
                      )}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "shadow-sm transition-all duration-200",
                        getPriorityColor(template.priority)
                      )}
                    >
                      {template.priority}
                    </Badge>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(template.id, template.is_active)}>
                      {template.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Assignment:</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="capitalize">{template.assignment_type}</span>
                  </div>
                </div>

                {template.start_time && template.end_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Window:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{template.start_time} - {template.end_time}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verification:</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{template.require_verification ? 'Required' : 'Optional'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(new Date(template.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Scheduled Days */}
              {template.scheduled_days && template.scheduled_days.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Scheduled Days:</span>
                  <div className="flex flex-wrap gap-1">
                    {template.scheduled_days.map(day => (
                      <Badge key={day} variant="outline" className="text-xs capitalize">
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first template to get started.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Template Dialog */}
      <ChecklistCreationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Template Dialog */}
      <ChecklistEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        checklistId={editingChecklistId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
              All associated instances will remain, but the template will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTemplate} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
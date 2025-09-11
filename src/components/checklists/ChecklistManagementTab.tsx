import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useChecklists, useUpdateChecklistStatus } from '@/hooks/useChecklists';
import { ChecklistCreationDialog } from './ChecklistCreationDialog';
import { Checklist } from '@/types/checklist';
import { Plus, Search, Filter, Edit, MoreVertical, Users, Clock, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export const ChecklistManagementTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: checklists, isLoading } = useChecklists();
  const updateStatus = useUpdateChecklistStatus();

  const filteredChecklists = checklists?.filter(checklist => {
    const matchesSearch = checklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checklist.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || checklist.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, status: 'active' | 'inactive' | 'archived') => {
    updateStatus.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'draft':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
        Showing {filteredChecklists?.length || 0} of {checklists?.length || 0} checklists
      </div>

      {/* Checklists Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredChecklists?.map((checklist) => (
          <Card key={checklist.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold mb-2">
                    {checklist.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(checklist.status)}>
                      {checklist.status}
                    </Badge>
                    <Badge className={getPriorityColor(checklist.priority)}>
                      {checklist.priority}
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
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Checklist
                    </DropdownMenuItem>
                    {checklist.status === 'active' && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(checklist.id, 'inactive')}
                      >
                        Deactivate
                      </DropdownMenuItem>
                    )}
                    {checklist.status === 'inactive' && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(checklist.id, 'active')}
                      >
                        Activate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(checklist.id, 'archived')}
                    >
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {checklist.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {checklist.description}
                </p>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Assignment:</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="capitalize">{checklist.assignment_type.replace('_', ' ')}</span>
                  </div>
                </div>

                {checklist.execution_window_start && checklist.execution_window_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Window:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {checklist.execution_window_start} - {checklist.execution_window_end}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verification:</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{checklist.verification_required ? 'Required' : 'Optional'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(new Date(checklist.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Additional Info */}
              {checklist.branch_area && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">{checklist.branch_area}</Badge>
                  {checklist.shift_type && (
                    <Badge variant="outline">{checklist.shift_type}</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChecklists?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No checklists found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first checklist to get started.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Checklist
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Checklist Dialog */}
      <ChecklistCreationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUsers, useComplianceTemplates, useAssignCompliance, useBulkAssignCompliance } from '@/hooks/useComplianceAssignment';
import { toast } from '@/components/ui/sonner';
import { Users, Calendar, AlertCircle, Send } from 'lucide-react';

export const ComplianceAssignmentManager = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: templates = [], isLoading: templatesLoading } = useComplianceTemplates();
  const assignCompliance = useAssignCompliance();
  const bulkAssignCompliance = useBulkAssignCompliance();

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select a compliance training template');
      return;
    }

    try {
      if (selectedUsers.length === 1) {
        await assignCompliance.mutateAsync({
          templateId: selectedTemplate,
          userId: selectedUsers[0],
          dueDate: dueDate || undefined,
          priority,
          notes: notes || undefined,
        });
      } else {
        await bulkAssignCompliance.mutateAsync({
          templateId: selectedTemplate,
          userIds: selectedUsers,
          dueDate: dueDate || undefined,
          priority,
          notes: notes || undefined,
        });
      }

      // Reset form
      setSelectedUsers([]);
      setSelectedTemplate('');
      setDueDate('');
      setPriority('medium');
      setNotes('');
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  const isLoading = usersLoading || templatesLoading;
  const isAssigning = assignCompliance.isPending || bulkAssignCompliance.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Assign Compliance Training
          </CardTitle>
          <CardDescription>
            Select users and assign compliance training templates to them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div>
            <Label htmlFor="template-select" className="text-sm font-medium">
              Compliance Training Template *
            </Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a training template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.title}</span>
                      {template.description && (
                        <span className="text-xs text-muted-foreground">
                          {template.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due-date" className="text-sm font-medium">
                Due Date (Optional)
              </Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="priority-select" className="text-sm font-medium">
                Priority
              </Label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assignment-notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="assignment-notes"
              placeholder="Add any additional notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Users ({selectedUsers.length} selected)
          </CardTitle>
          <CardDescription>
            Choose which users to assign this compliance training to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Select All */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="whitespace-nowrap"
            >
              {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground mt-2">
                  {searchQuery ? 'No users found matching your search' : 'No users available'}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleUserToggle(user.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAssign}
          disabled={selectedUsers.length === 0 || !selectedTemplate || isAssigning}
          className="min-w-32"
        >
          {isAssigning ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Assigning...
            </div>
          ) : (
            `Assign to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </div>
  );
};
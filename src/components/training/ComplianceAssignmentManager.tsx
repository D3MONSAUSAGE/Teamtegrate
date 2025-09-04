import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, UserCheck, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useUsers,
  useComplianceTemplates,
  useAssignCompliance,
  useBulkAssignCompliance,
  useComplianceAssignments
} from '@/hooks/useComplianceAssignment';
import { toast } from '@/components/ui/sonner';

interface ComplianceAssignmentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ComplianceAssignmentManager: React.FC<ComplianceAssignmentManagerProps> = ({
  open,
  onOpenChange
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [assignmentType, setAssignmentType] = useState<'individual' | 'bulk'>('individual');

  const { data: users = [] } = useUsers();
  const { data: templates = [] } = useComplianceTemplates();
  const { data: existingAssignments = [] } = useComplianceAssignments();
  const assignMutation = useAssignCompliance();
  const bulkAssignMutation = useBulkAssignCompliance();

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const isUserAlreadyAssigned = (userId: string) => {
    return existingAssignments.some(
      assignment => 
        assignment.user_id === userId && 
        assignment.compliance_template_id === selectedTemplate
    );
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const availableUserIds = filteredUsers
      .filter(user => !isUserAlreadyAssigned(user.id))
      .map(user => user.id);
    setSelectedUsers(availableUserIds);
  };

  const handleClearAll = () => {
    setSelectedUsers([]);
  };

  const handleAssign = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a compliance template');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      if (assignmentType === 'individual' && selectedUsers.length === 1) {
        await assignMutation.mutateAsync({
          templateId: selectedTemplate,
          userId: selectedUsers[0],
          dueDate: dueDate?.toISOString(),
          priority,
          notes: notes || undefined
        });
      } else {
        await bulkAssignMutation.mutateAsync({
          templateId: selectedTemplate,
          userIds: selectedUsers,
          dueDate: dueDate?.toISOString(),
          priority,
          notes: notes || undefined
        });
      }

      // Reset form
      setSelectedTemplate('');
      setSelectedUsers([]);
      setDueDate(undefined);
      setPriority('medium');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Assignment error:', error);
    }
  };

  const selectedTemplate_ = templates.find(t => t.id === selectedTemplate);
  const isLoading = assignMutation.isPending || bulkAssignMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Compliance Training
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Compliance Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a compliance template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span>{template.name}</span>
                      {template.jurisdiction && (
                        <span className="text-xs text-muted-foreground">
                          {template.jurisdiction}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate_ && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate_.description}
                </p>
                {selectedTemplate_.jurisdiction && (
                  <Badge variant="outline" className="mt-1">
                    {selectedTemplate_.jurisdiction}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes for this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* User Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Users</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={!selectedTemplate}
                  >
                    Select All Available
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search users by name or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />

                {selectedUsers.length > 0 && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium">
                      {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredUsers.map((user) => {
                    const isAlreadyAssigned = isUserAlreadyAssigned(user.id);
                    const isSelected = selectedUsers.includes(user.id);

                    return (
                      <div
                        key={user.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          isAlreadyAssigned ? "bg-muted/50 border-muted" : "bg-background",
                          isSelected && !isAlreadyAssigned && "ring-2 ring-primary/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleUserToggle(user.id)}
                            disabled={isAlreadyAssigned}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{user.role}</Badge>
                          {isAlreadyAssigned && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Already Assigned</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found matching your search.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Users with existing assignments will be skipped
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedTemplate || selectedUsers.length === 0 || isLoading}
                className="min-w-24"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Assigning...
                  </>
                ) : (
                  `Assign to ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceAssignmentManager;
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCreateChecklist } from '@/hooks/useChecklists';
import { ChecklistFormData, ChecklistPriority, AssignmentType } from '@/types/checklist';
import { Plus, X, GripVertical, Clock, Users, Settings } from 'lucide-react';

interface ChecklistCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChecklistCreationDialog: React.FC<ChecklistCreationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState<ChecklistFormData>({
    name: '',
    description: '',
    priority: 'medium' as ChecklistPriority,
    assignment_type: 'individual' as AssignmentType,
    execution_window_start: '',
    execution_window_end: '',
    cutoff_time: '',
    branch_area: '',
    shift_type: '',
    verification_required: true,
    scoring_enabled: true,
    items: [],
    assignments: [],
  });

  const [currentItem, setCurrentItem] = useState({
    title: '',
    description: '',
    is_required: true,
    verification_required: true,
  });

  const createChecklist = useCreateChecklist();

  const handleAddItem = () => {
    if (currentItem.title.trim()) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...currentItem }]
      }));
      setCurrentItem({
        title: '',
        description: '',
        is_required: true,
        verification_required: true,
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    if (formData.items.length === 0) return;

    try {
      await createChecklist.mutateAsync(formData);
      onOpenChange(false);
      // Reset form
      setFormData({
        name: '',
        description: '',
        priority: 'medium',
        assignment_type: 'individual',
        execution_window_start: '',
        execution_window_end: '',
        cutoff_time: '',
        branch_area: '',
        shift_type: '',
        verification_required: true,
        scoring_enabled: true,
        items: [],
        assignments: [],
      });
    } catch (error) {
      console.error('Error creating checklist:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Checklist</DialogTitle>
          <DialogDescription>
            Design a checklist template that can be assigned to team members for daily execution
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 h-0 pointer-events-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Checklist Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Daily Opening Procedures"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: ChecklistPriority) => 
                        setFormData(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this checklist's purpose..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timing & Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timing & Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="execution_window_start">Start Time</Label>
                    <Input
                      id="execution_window_start"
                      type="time"
                      value={formData.execution_window_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, execution_window_start: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="execution_window_end">End Time</Label>
                    <Input
                      id="execution_window_end"
                      type="time"
                      value={formData.execution_window_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, execution_window_end: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cutoff_time">Cutoff Time</Label>
                    <Input
                      id="cutoff_time"
                      type="time"
                      value={formData.cutoff_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, cutoff_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch_area">Branch/Area</Label>
                    <Input
                      id="branch_area"
                      value={formData.branch_area}
                      onChange={(e) => setFormData(prev => ({ ...prev, branch_area: e.target.value }))}
                      placeholder="e.g., Front Office, Kitchen"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shift_type">Shift Type</Label>
                    <Input
                      id="shift_type"
                      value={formData.shift_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, shift_type: e.target.value }))}
                      placeholder="e.g., Morning, Evening, Night"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assignment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <Select
                    value={formData.assignment_type}
                    onValueChange={(value: AssignmentType) => 
                      setFormData(prev => ({ ...prev, assignment_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Assignment</SelectItem>
                      <SelectItem value="team">Team Assignment</SelectItem>
                      <SelectItem value="role_based">Role-Based Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verification Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require manager verification after completion
                    </p>
                  </div>
                  <Switch
                    checked={formData.verification_required}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, verification_required: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Scoring Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Track completion scores and performance metrics
                    </p>
                  </div>
                  <Switch
                    checked={formData.scoring_enabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, scoring_enabled: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Checklist Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Checklist Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Item Form */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Add New Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-title">Item Title *</Label>
                      <Input
                        id="item-title"
                        value={currentItem.title}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Check inventory levels"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-description">Description</Label>
                      <Input
                        id="item-description"
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional details..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="item-required"
                        checked={currentItem.is_required}
                        onCheckedChange={(checked) => 
                          setCurrentItem(prev => ({ ...prev, is_required: checked }))
                        }
                      />
                      <Label htmlFor="item-required">Required</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="item-verification"
                        checked={currentItem.verification_required}
                        onCheckedChange={(checked) => 
                          setCurrentItem(prev => ({ ...prev, verification_required: checked }))
                        }
                      />
                      <Label htmlFor="item-verification">Verification Required</Label>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!currentItem.title.trim()}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {/* Items List */}
                {formData.items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Items ({formData.items.length})</h4>
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          )}
                          <div className="flex gap-2 mt-1">
                            {item.is_required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                            {item.verification_required && (
                              <Badge variant="outline" className="text-xs">Verification</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.items.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No items added yet. Add at least one item to continue.
                  </p>
                )}
              </CardContent>
            </Card>
          </form>
        </ScrollArea>

        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || formData.items.length === 0 || createChecklist.isPending}
          >
            {createChecklist.isPending ? 'Creating...' : 'Create Checklist'}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
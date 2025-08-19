import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useScheduleManagement, ShiftTemplate } from '@/hooks/useScheduleManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Clock, Users, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const ShiftTemplateManager: React.FC = () => {
  const { user } = useAuth();
  const { shiftTemplates, createShiftTemplate, isLoading } = useScheduleManagement();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    break_duration_minutes: 0,
    max_employees: 1,
    min_employees: 1,
    is_recurring: false,
    recurrence_pattern: ''
  });

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organization_id) return;

    try {
      await createShiftTemplate({
        ...formData,
        organization_id: user.organization_id
      });
      toast.success('Shift template created successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        start_time: '',
        end_time: '',
        break_duration_minutes: 0,
        max_employees: 1,
        min_employees: 1,
        is_recurring: false,
        recurrence_pattern: ''
      });
    } catch (error) {
      toast.error('Failed to create shift template');
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal place
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shift Templates</h2>
          <p className="text-muted-foreground">
            Create and manage reusable shift templates
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Shift Template</DialogTitle>
              <DialogDescription>
                Create a reusable shift template for scheduling
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateShift} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Shift, Evening Shift"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="break_duration">Break Duration (minutes)</Label>
                <Input
                  id="break_duration"
                  type="number"
                  min="0"
                  max="480"
                  value={formData.break_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, break_duration_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_employees">Min Employees</Label>
                  <Input
                    id="min_employees"
                    type="number"
                    min="1"
                    value={formData.min_employees}
                    onChange={(e) => setFormData({ ...formData, min_employees: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_employees">Max Employees</Label>
                  <Input
                    id="max_employees"
                    type="number"
                    min="1"
                    value={formData.max_employees}
                    onChange={(e) => setFormData({ ...formData, max_employees: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  Create Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shift Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shiftTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(template.start_time)} - {formatTime(template.end_time)}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {calculateDuration(template.start_time, template.end_time)}h
                </span>
              </div>
              
              {template.break_duration_minutes > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Break:</span>
                  <span className="font-medium">{template.break_duration_minutes}min</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Employees:
                </span>
                <span className="font-medium">
                  {template.min_employees}-{template.max_employees}
                </span>
              </div>
              
              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {shiftTemplates.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No shift templates yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first shift template to get started with scheduling
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
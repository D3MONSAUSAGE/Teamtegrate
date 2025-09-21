import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryTemplate } from '@/contexts/inventory/types';
import { 
  FileText, 
  Users, 
  Calendar,
  Clock,
  Search,
  Package
} from 'lucide-react';

interface TeamAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: InventoryTemplate[];
  teams: any[];
  onAssign: (templateId: string, teamIds: string[], options?: AssignmentOptions) => void;
}

interface AssignmentOptions {
  scheduledDate?: string;
  recurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  notes?: string;
}

export const TeamAssignmentDialog: React.FC<TeamAssignmentDialogProps> = ({
  open,
  onOpenChange,
  templates,
  teams,
  onAssign
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOptions>({
    priority: 'medium',
    recurring: false,
    recurringType: 'weekly'
  });
  const [loading, setLoading] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeamIds.length === filteredTeams.length) {
      setSelectedTeamIds([]);
    } else {
      setSelectedTeamIds(filteredTeams.map(team => team.id));
    }
  };

  const handleAssign = async () => {
    if (!selectedTemplateId || selectedTeamIds.length === 0) return;

    setLoading(true);
    try {
      await onAssign(selectedTemplateId, selectedTeamIds, assignmentOptions);
      // Reset form
      setSelectedTemplateId('');
      setSelectedTeamIds([]);
      setAssignmentOptions({
        priority: 'medium',
        recurring: false,
        recurringType: 'weekly'
      });
    } catch (error) {
      console.error('Error assigning template:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAssign = selectedTemplateId && selectedTeamIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assign Template to Teams
          </DialogTitle>
          <DialogDescription>
            Select a template and teams to create inventory assignments. Teams will be notified and can begin their counts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template to assign..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>{template.name}</span>
                      {template.description && (
                        <span className="text-xs text-muted-foreground">
                          - {template.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTemplate && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedTemplate.name}</h4>
                    {selectedTemplate.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    Standard
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Teams</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredTeams.length === 0}
              >
                {selectedTeamIds.length === filteredTeams.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded"
                >
                  <Checkbox
                    id={team.id}
                    checked={selectedTeamIds.includes(team.id)}
                    onCheckedChange={() => handleTeamToggle(team.id)}
                  />
                  <label
                    htmlFor={team.id}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{team.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {team.member_count} members
                      </Badge>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {selectedTeamIds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedTeamIds.length} team{selectedTeamIds.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Assignment Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Assignment Options</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select
                  value={assignmentOptions.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setAssignmentOptions(prev => ({ ...prev, priority: value }))
                  }
                >
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
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input
                  type="date"
                  value={assignmentOptions.dueDate || ''}
                  onChange={(e) =>
                    setAssignmentOptions(prev => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={assignmentOptions.recurring}
                  onCheckedChange={(checked) =>
                    setAssignmentOptions(prev => ({ ...prev, recurring: checked as boolean }))
                  }
                />
                <Label htmlFor="recurring" className="text-sm">
                  Make this a recurring assignment
                </Label>
              </div>

              {assignmentOptions.recurring && (
                <Select
                  value={assignmentOptions.recurringType}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                    setAssignmentOptions(prev => ({ ...prev, recurringType: value }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Notes (Optional)</Label>
              <Input
                placeholder="Add any special instructions..."
                value={assignmentOptions.notes || ''}
                onChange={(e) =>
                  setAssignmentOptions(prev => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!canAssign || loading}
          >
            {loading ? 'Assigning...' : `Assign to ${selectedTeamIds.length} Team${selectedTeamIds.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, Calendar } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useOnboardingInstances } from '@/hooks/onboarding/useOnboardingInstances';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AssignmentDialogProps {
  template: any;
  open: boolean;
  onClose: () => void;
}

export function AssignmentDialog({ template, open, onClose }: AssignmentDialogProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');

  const { users, isLoading: isLoadingUsers } = useUsers();
  const { createInstance, isCreating } = useOnboardingInstances();

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEmployee = (userId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    setSelectedEmployees(filteredUsers.map(user => user.id));
  };

  const clearAll = () => {
    setSelectedEmployees([]);
  };

  const handleAssign = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    try {
      // Create instances for each selected employee
      const assignments = selectedEmployees.map(employeeId => 
        createInstance.mutateAsync({
          employee_id: employeeId,
          template_id: template.id,
          start_date: startDate,
        })
      );

      await Promise.all(assignments);
      toast.success(`Onboarding assigned to ${selectedEmployees.length} employee(s)`);
      onClose();
    } catch (error) {
      toast.error('Failed to assign onboarding');
    }
  };

  const handleClose = () => {
    setSelectedEmployees([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Template: {template?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Start Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="startDate">When should the onboarding begin?</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employee Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Select Employees</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedEmployees.length} selected
                  </Badge>
                  {filteredUsers.length > 0 && (
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAll}>
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Employee List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading employees...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchQuery ? 'No employees match your search' : 'No employees found'}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleEmployee(user.id)}
                    >
                      <Checkbox
                        checked={selectedEmployees.includes(user.id)}
                        onChange={() => toggleEmployee(user.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {user.name || user.email}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={selectedEmployees.length === 0 || isCreating}
              className="min-w-32"
            >
              {isCreating ? 'Assigning...' : `Assign to ${selectedEmployees.length} Employee(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
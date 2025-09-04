import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowRight, 
  UserCheck, 
  BookOpen, 
  PenTool, 
  Search,
  User,
  AlertCircle,
  Calendar,
  Target
} from 'lucide-react';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useReassignTraining, useCanReassignTraining } from '@/hooks/useTrainingReassignment';
import { format, parseISO } from 'date-fns';

interface ReassignTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
}

const ReassignTrainingDialog: React.FC<ReassignTrainingDialogProps> = ({ 
  open, 
  onOpenChange, 
  assignment 
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { users = [], loading: usersLoading } = useOrganizationUsers();
  const { canReassign } = useCanReassignTraining();
  const reassignMutation = useReassignTraining();

  // Filter users based on search term and exclude current assignee
  const filteredUsers = users.filter(user => 
    user.id !== assignment?.assigned_to &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleReassign = async () => {
    if (!assignment || !selectedUserId || !reason.trim()) return;

    try {
      await reassignMutation.mutateAsync({
        assignmentId: assignment.id,
        newAssigneeId: selectedUserId,
        reason: reason.trim()
      });
      
      // Reset form
      setSelectedUserId('');
      setReason('');
      setSearchTerm('');
      onOpenChange(false);
    } catch (error) {
      console.error('Reassignment failed:', error);
    }
  };

  const selectedUser = users.find(user => user.id === selectedUserId);
  const currentAssignee = users.find(user => user.id === assignment?.assigned_to);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!canReassign) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              You don't have permission to reassign training assignments.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10">
              <ArrowRight className="h-5 w-5 text-orange-600" />
            </div>
            Reassign Training Assignment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    {assignment?.assignment_type === 'course' ? (
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    ) : (
                      <PenTool className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{assignment?.content_title}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {assignment?.assignment_type}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getStatusColor(assignment?.status)}>
                    {assignment?.status?.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(assignment?.priority)}>
                    {assignment?.priority} priority
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Assigned: {assignment && format(parseISO(assignment.assigned_at), 'MMM d, yyyy')}
                </div>
                {assignment?.due_date && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Due: {format(parseISO(assignment.due_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>

              {/* Current Assignee */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Currently assigned to:</p>
                    <p className="text-sm text-muted-foreground">
                      {currentAssignee?.name} ({currentAssignee?.email}) - {currentAssignee?.role}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reassignment Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select New Assignee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUserId === user.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <div className="p-1 rounded bg-gray-100">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                        {selectedUserId === user.id && (
                          <UserCheck className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Reassignment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reassignment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Reassignment *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a reason for this reassignment..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                  />
                </div>

                {selectedUser && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      <p className="font-medium text-green-800">New Assignee</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded bg-green-100">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{selectedUser.name}</p>
                        <p className="text-sm text-green-600">{selectedUser.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                        {selectedUser.role}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 mb-1">Important Notes:</p>
                      <ul className="space-y-1 text-amber-700">
                        <li>• The original assignment will be marked as "reassigned"</li>
                        <li>• A new assignment will be created for the new assignee</li>
                        <li>• Both users will be notified of this change</li>
                        <li>• This action is logged for audit purposes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReassign}
              disabled={!selectedUserId || !reason.trim() || reassignMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {reassignMutation.isPending ? 'Reassigning...' : 'Reassign Training'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignTrainingDialog;
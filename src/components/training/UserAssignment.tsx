import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Send, 
  Clock, 
  User, 
  Search,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useTrainingCourses, useQuizzes, useCreateTrainingAssignment } from '@/hooks/useTrainingData';
import { format } from 'date-fns';
import TrainingReassignmentManager from './TrainingReassignmentManager';

interface UserAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserAssignment: React.FC<UserAssignmentProps> = ({ open, onOpenChange }) => {
  const [selectedType, setSelectedType] = useState<'course' | 'quiz'>('quiz');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('assign');

  const { users = [], loading: usersLoading } = useOrganizationUsers();
  const { data: courses = [] } = useTrainingCourses();
  const { data: quizzes = [] } = useQuizzes();
  const createAssignment = useCreateTrainingAssignment();

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!selectedItem || selectedUsers.length === 0) return;

    try {
      // Get content title
      const content = selectedType === 'course' 
        ? courses.find(c => c.id === selectedItem)
        : quizzes.find(q => q.id === selectedItem);
      
      if (!content) {
        console.error('Content not found');
        return;
      }

      await createAssignment.mutateAsync({
        assignmentType: selectedType,
        contentId: selectedItem,
        contentTitle: content.title,
        assignedUsers: selectedUsers,
        dueDate: dueDate || undefined,
        priority
      });

      // Reset form
      setSelectedItem('');
      setSelectedUsers([]);
      setDueDate('');
      setPriority('medium');
      onOpenChange(false);
    } catch (error) {
      console.error('Assignment failed:', error);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
            Assign Training Content
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assign">New Assignment</TabsTrigger>
            <TabsTrigger value="reassign">Reassignment</TabsTrigger>
            <TabsTrigger value="history">Assignment History</TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assignment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={selectedType} onValueChange={(value: 'course' | 'quiz') => setSelectedType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course">Training Course</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select {selectedType === 'course' ? 'Course' : 'Quiz'}</Label>
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Choose a ${selectedType}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedType === 'course' 
                          ? courses.map((course: any) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))
                          : quizzes.map((quiz: any) => (
                              <SelectItem key={quiz.id} value={quiz.id}>
                                {quiz.title}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Date (optional)</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
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
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(priority)}>
                        {priority} Priority
                      </Badge>
                      {dueDate && (
                        <Badge variant="outline">
                          Due: {format(new Date(dueDate), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </CardContent>
              </Card>

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
                      >
                        {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Badge variant="secondary">
                        {selectedUsers.length}/{filteredUsers.length}
                      </Badge>
                    </div>
                  </div>
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

                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleUserToggle(user.id)}
                        >
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                          />
                          <div className="flex items-center gap-3 flex-1">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssign}
                disabled={!selectedItem || selectedUsers.length === 0 || createAssignment.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Send className="h-4 w-4 mr-2" />
                {createAssignment.isPending ? 'Assigning...' : `Assign to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reassign" className="space-y-4">
            <TrainingReassignmentManager 
              open={true} 
              onOpenChange={() => {}} 
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Assignment history will appear here once assignments are created.</p>
                  <p className="text-sm mt-2">This feature tracks all training assignments and their completion status.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserAssignment;
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Plus,
  Filter,
  CheckSquare,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TeamMemberTasksView from '@/components/team/detail/TeamMemberTasksView';

interface TeamTasksTabProps {
  teamId: string;
  teamMembers: any[];
}

const TeamTasksTab: React.FC<TeamTasksTabProps> = ({ teamId, teamMembers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
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
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-48">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.users?.name || member.users?.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Task Management Actions */}
      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
        <Badge variant="outline" className="text-xs">Quick Actions:</Badge>
        <Button variant="ghost" size="sm" className="h-7 text-xs">Bulk Assign</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs">Update Status</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs">Set Priority</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs">Export Tasks</Button>
      </div>

      {/* Team Workload Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckSquare className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <p className="text-xl font-bold text-green-600">23</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">In Progress</span>
          </div>
          <p className="text-xl font-bold text-blue-600">12</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BarChart3 className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-xl font-bold text-yellow-600">8</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <User className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Assigned</span>
          </div>
          <p className="text-xl font-bold text-purple-600">{teamMembers.length}</p>
        </div>
      </div>

      {/* Enhanced Tasks View */}
      <div className="relative">
        <TeamMemberTasksView teamId={teamId} teamMembers={teamMembers} />
      </div>

      {/* Task Analytics */}
      <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
        <div className="space-y-3">
          <h4 className="font-semibold">Task Distribution</h4>
          <div className="space-y-2">
            {teamMembers.slice(0, 3).map((member, index) => (
              <div key={member.user_id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">{member.users?.name || 'Unknown'}</span>
                <Badge variant="outline" className="text-xs">
                  {Math.floor(Math.random() * 10) + 1} tasks
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-semibold">Performance Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
              <span className="text-sm">Completion Rate</span>
              <span className="text-sm font-medium text-green-600">85%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
              <span className="text-sm">Avg. Task Time</span>
              <span className="text-sm font-medium">3.2 days</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
              <span className="text-sm">Overdue Tasks</span>
              <span className="text-sm font-medium text-red-600">2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamTasksTab;
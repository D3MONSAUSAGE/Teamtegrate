
import React from 'react';
import { Project, Task, TaskStatus } from '@/types';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import TaskCard from '../task-card/TaskCard';

export interface ProjectTasksContentProps {
  project: Project;
  projectTasks: Task[];
  searchQuery: string;
  sortBy: string;
  filterBy: string;
  onSearchChange: (query: string) => void; // Add missing prop
  onSortChange: (sort: string) => void;
  onFilterChange: (filter: string) => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
  onAddTeamMember: () => void;
  onRemoveTeamMember: (userId: string) => void;
  isCurrentUserMemberOrCreator: boolean;
  canCurrentUserEdit: boolean;
}

const ProjectTasksContent: React.FC<ProjectTasksContentProps> = ({
  project,
  projectTasks,
  searchQuery,
  sortBy,
  filterBy,
  onSearchChange, // Now properly typed
  onSortChange,
  onFilterChange,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onTaskStatusChange,
  onAddTeamMember,
  onRemoveTeamMember,
  isCurrentUserMemberOrCreator,
  canCurrentUserEdit
}) => {
  // Filter and sort tasks based on search query and filters
  const filteredTasks = projectTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    return matchesSearch && task.status === filterBy;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'priority':
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* Task Creation Button */}
      {isCurrentUserMemberOrCreator && (
        <div className="flex justify-end">
          <Button onClick={onCreateTask} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || filterBy !== 'all' 
              ? 'No tasks match your current filters' 
              : 'No tasks in this project yet'}
          </div>
        ) : (
          sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              onStatusChange={(status) => onTaskStatusChange(task.id, status)}
              showProjectInfo={false}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectTasksContent;

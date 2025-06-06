
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import TaskAssigneeSelect from './TaskAssigneeSelect';
import TaskMultiAssigneeSelect from './TaskMultiAssigneeSelect';
import TaskMultiAssigneeFallback from './TaskMultiAssigneeFallback';
import TaskAssignmentErrorBoundary from './TaskAssignmentErrorBoundary';
import { AppUser } from '@/types';

interface TaskAssignmentSectionProps {
  selectedMember: string;
  selectedMembers?: string[];
  onAssign: (userId: string) => void;
  onMembersChange?: (memberIds: string[]) => void;
  users: AppUser[];
  isLoading: boolean;
  multiSelect?: boolean;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  selectedMember,
  selectedMembers = [],
  onAssign,
  onMembersChange,
  users,
  isLoading,
  multiSelect = false
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentMode, setCurrentMode] = useState(multiSelect);
  const [useFallback, setUseFallback] = useState(false);

  console.log('TaskAssignmentSection - render:', { 
    multiSelect, 
    isLoading, 
    usersLength: users?.length,
    isTransitioning,
    currentMode,
    useFallback
  });

  // Enhanced data validation at parent level
  const isDataReady = !isLoading && 
                      Array.isArray(users) && 
                      users.length > 0 && 
                      users.every(user => user && user.id && user.name);

  // Handle mode transitions with delay
  useEffect(() => {
    if (multiSelect !== currentMode) {
      console.log('TaskAssignmentSection - Mode change detected, starting transition');
      setIsTransitioning(true);
      
      // Add transition delay to ensure clean unmounting
      const timer = setTimeout(() => {
        setCurrentMode(multiSelect);
        setIsTransitioning(false);
        console.log('TaskAssignmentSection - Transition complete');
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [multiSelect, currentMode]);

  const handleFallback = () => {
    console.log('TaskAssignmentSection - Switching to fallback component');
    setUseFallback(true);
  };

  // Don't render assignment components during transition or if data isn't ready
  if (isTransitioning || !isDataReady) {
    console.log('TaskAssignmentSection - Showing loading state');
    return (
      <div>
        <Label htmlFor="assignee">Assign To</Label>
        <div className="mt-2 p-3 border border-gray-200 rounded-md bg-gray-50">
          <span className="text-sm text-gray-500">
            {isTransitioning ? 'Switching mode...' : 'Loading team members...'}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <Label htmlFor="assignee">Assign To</Label>
      <TaskAssignmentErrorBoundary fallback={
        <div className="space-y-2">
          <div className="text-sm text-red-600 p-2 border border-red-200 rounded">
            Component error. Using simple fallback.
          </div>
          <TaskMultiAssigneeFallback
            selectedMembers={selectedMembers}
            onMembersChange={onMembersChange || (() => {})}
            users={users}
            isLoading={false}
          />
        </div>
      }>
        {currentMode && onMembersChange ? (
          useFallback ? (
            <TaskMultiAssigneeFallback
              key="fallback-multi"
              selectedMembers={selectedMembers}
              onMembersChange={onMembersChange}
              users={users}
              isLoading={isLoading}
            />
          ) : (
            <TaskMultiAssigneeSelect
              key="cmdk-multi"
              selectedMembers={selectedMembers}
              onMembersChange={onMembersChange}
              users={users}
              isLoading={isLoading}
              onError={handleFallback}
            />
          )
        ) : (
          <TaskAssigneeSelect
            key="single"
            selectedMember={selectedMember}
            onAssign={onAssign}
            users={users}
            isLoading={isLoading}
          />
        )}
      </TaskAssignmentErrorBoundary>
    </div>
  );
};

export default TaskAssignmentSection;


import React from 'react';
import { Loader2 } from 'lucide-react';
import { Task } from '@/types';
import TeamMemberCard from './TeamMemberCard';
import ManagerPerformanceCard from './ManagerPerformanceCard';
import UnassignedTasksSection from './UnassignedTasksSection';
import NoTeamMembers from './NoTeamMembers';

interface TeamMemberPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  completionRate: number;
  totalTasks: number;
  dueTodayTasks: number;
  projects: number;
}

interface ManagerPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  completionRate: number;
  totalTasks: number;
  dueTodayTasks: number;
  projects: number;
}

interface TeamPageContentProps {
  managerPerformance: ManagerPerformance | null;
  teamMembersPerformance: TeamMemberPerformance[];
  teamMembersCount: number;
  unassignedTasks: Task[];
  isTeamMembersLoading: boolean;
  removingMemberId: string | null;
  onRemoveMember: (memberId: string) => void;
  onAddMember: () => void;
  onReassignTask: (taskId: string) => void;
}

const TeamPageContent: React.FC<TeamPageContentProps> = ({
  managerPerformance,
  teamMembersPerformance,
  teamMembersCount,
  unassignedTasks,
  isTeamMembersLoading,
  removingMemberId,
  onRemoveMember,
  onAddMember,
  onReassignTask
}) => {
  return (
    <>
      {/* Manager Performance Section */}
      {managerPerformance && managerPerformance.totalTasks > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Manager Performance</h2>
          <div className="mb-8">
            <ManagerPerformanceCard manager={managerPerformance} />
          </div>
        </>
      )}
      
      <h2 className="text-xl font-semibold mb-4">Team Members</h2>
      
      {isTeamMembersLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading team members...</span>
        </div>
      ) : teamMembersCount === 0 ? (
        <NoTeamMembers onAddMember={onAddMember} />
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-8">
          {teamMembersPerformance.map((member) => (
            <TeamMemberCard 
              key={member.id} 
              member={member}
              onRemove={onRemoveMember}
              isRemoving={removingMemberId === member.id}
            />
          ))}
        </div>
      )}
      
      {/* Unassigned Tasks Section */}
      <UnassignedTasksSection 
        unassignedTasks={unassignedTasks}
        onReassignTask={onReassignTask}
      />
    </>
  );
};

export default TeamPageContent;

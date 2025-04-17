
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamMemberPerformanceData {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  projects: number;
}

interface TeamMemberRankingsProps {
  teamMembersPerformance: TeamMemberPerformanceData[];
}

const TeamMemberRankings: React.FC<TeamMemberRankingsProps> = ({ 
  teamMembersPerformance 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Member Rankings</CardTitle>
        <CardDescription>Performance rankings based on task completion</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Tasks Assigned</TableHead>
              <TableHead>Tasks Completed</TableHead>
              <TableHead>Completion Rate</TableHead>
              <TableHead>Projects</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembersPerformance
              .sort((a, b) => b.completionRate - a.completionRate)
              .map((member, index) => (
                <TableRow key={member.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.totalTasks}</TableCell>
                  <TableCell>{member.completedTasks}</TableCell>
                  <TableCell>{member.completionRate}%</TableCell>
                  <TableCell>{member.projects}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TeamMemberRankings;

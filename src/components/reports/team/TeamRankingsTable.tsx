import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamMemberPerformance } from '@/types/performance';

interface TeamRankingsTableProps {
  teamMembersPerformance: TeamMemberPerformance[];
}

const TeamRankingsTable: React.FC<TeamRankingsTableProps> = ({ teamMembersPerformance }) => {
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

export default TeamRankingsTable;

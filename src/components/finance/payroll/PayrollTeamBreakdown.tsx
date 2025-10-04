import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TeamPayrollData } from '@/types/payroll';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface PayrollTeamBreakdownProps {
  teamData: TeamPayrollData[];
}

export const PayrollTeamBreakdown: React.FC<PayrollTeamBreakdownProps> = ({ teamData }) => {
  if (!teamData || teamData.length === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLaborPercentageIndicator = (percentage: number) => {
    if (percentage < 25) return <CheckCircle className="h-4 w-4 text-success" />;
    if (percentage < 35) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Payroll</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Labor %</TableHead>
                <TableHead className="text-right">$/Hour</TableHead>
                <TableHead className="text-right">Avg Rate</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData.map((team) => (
                <TableRow key={team.teamId}>
                  <TableCell className="font-medium">{team.teamName}</TableCell>
                  <TableCell className="text-right">{team.hours.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">{formatCurrency(team.laborCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(team.sales)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {team.laborPercentage.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(team.salesPerHour)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(team.avgHourlyRate)}</TableCell>
                  <TableCell className="text-center">
                    {getLaborPercentageIndicator(team.laborPercentage)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

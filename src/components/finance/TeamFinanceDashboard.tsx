import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, CreditCard } from 'lucide-react';
import { useTeamContext } from '@/hooks/useTeamContext';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';

export const TeamFinanceDashboard: React.FC = () => {
  const teamContext = useTeamContext();

  // Ensure context is available
  if (!teamContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Finance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading team finance data...</p>
        </CardContent>
      </Card>
    );
  }

  const { selectedTeam } = teamContext;

  // Fetch team members for financial calculations
  const { teamMembers, isLoading: membersLoading } = useRealTeamMembers(selectedTeam?.id);

  // Calculate team financial metrics (mock implementation)
  const teamFinancials = {
    totalBudget: 50000,
    budgetUsed: teamMembers.reduce((sum, member) => sum + (member.totalTasks * 100), 0), // Mock calculation
    monthlyExpenses: teamMembers.length * 3000, // Mock monthly cost per member
    pendingExpenses: teamMembers.filter(m => m.inProgressTasks > 0).length * 500,
  };

  const budgetUtilization = Math.min(100, (teamFinancials.budgetUsed / teamFinancials.totalBudget) * 100);

  if (!selectedTeam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Finance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a team to view finance data</p>
        </CardContent>
      </Card>
      );
    }

    if (membersLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Team Finance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Loading financial data...</p>
          </CardContent>
        </Card>
      );
    }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
          <p className="text-muted-foreground">Finance Dashboard</p>
        </div>
        <Badge variant="outline">{selectedTeam.member_count} members</Badge>
      </div>

      {/* Finance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,240</div>
            <p className="text-xs text-muted-foreground">-5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">8 pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Petty Cash</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250</div>
            <p className="text-xs text-muted-foreground">Available balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Team Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Team Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Office Supplies</p>
                <p className="text-sm text-muted-foreground">Team expense</p>
              </div>
              <div className="text-right">
                <p className="font-medium">-$125.00</p>
                <p className="text-sm text-muted-foreground">Dec 15</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Client Payment</p>
                <p className="text-sm text-muted-foreground">Project revenue</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">+$2,500.00</p>
                <p className="text-sm text-muted-foreground">Dec 14</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
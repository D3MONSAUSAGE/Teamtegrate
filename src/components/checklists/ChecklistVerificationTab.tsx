import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePendingChecklistVerifications } from '@/hooks/useChecklistExecutions';
import { ChecklistVerificationDialog } from './ChecklistVerificationDialog';
import { ManagerDailyStats } from './ManagerDailyStats';
import { ChecklistExecution } from '@/types/checklist';
import { ShieldCheck, Search, User, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const ChecklistVerificationTab: React.FC = () => {
  const [selectedExecution, setSelectedExecution] = useState<ChecklistExecution | null>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: executions, isLoading } = usePendingChecklistVerifications();

  const filteredExecutions = executions?.filter(execution =>
    execution.checklist?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    execution.assigned_user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerifyExecution = (execution: ChecklistExecution) => {
    setSelectedExecution(execution);
    setVerificationDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Manager Daily Stats */}
        <ManagerDailyStats />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Pending Verifications</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredExecutions?.length || 0} checklists awaiting verification
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by checklist or employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Verification Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExecutions?.map((execution) => (
            <Card key={execution.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold truncate">
                    {execution.checklist?.name}
                  </CardTitle>
                  <Badge className={getPriorityColor(execution.checklist?.priority || 'medium')}>
                    {execution.checklist?.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{execution.assigned_user?.name}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {execution.checklist?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {execution.checklist.description}
                  </p>
                )}

                {/* Completion Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Completed: {format(new Date(execution.completed_at!), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(execution.completed_at!), 'h:mm a')}
                    </span>
                  </div>
                </div>

                {/* Execution Score */}
                <div className="flex justify-between text-sm">
                  <span>Execution Score:</span>
                  <span className="font-semibold text-green-600">
                    {execution.execution_score}/100
                  </span>
                </div>

                {/* Verify Button */}
                <Button
                  onClick={() => handleVerifyExecution(execution)}
                  className="w-full"
                  variant="outline"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify Checklist
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExecutions?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pending verifications</h3>
              <p className="text-muted-foreground">
                All completed checklists have been verified. New submissions will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verification Dialog */}
      <ChecklistVerificationDialog
        execution={selectedExecution}
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
      />
    </>
  );
};
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, AlertCircle, Play, Eye } from 'lucide-react';
import { checklistInstanceService, ChecklistInstance, TeamChecklistSummary } from '@/services/checklists';
import { useQuery } from '@tanstack/react-query';
import { hasRoleAccess } from '@/contexts/auth';

const ChecklistsPageV2: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-checklists');
  const canManage = user ? hasRoleAccess(user.role, 'manager') : false;

  // Fetch today's checklist instances
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['checklist-instances-today', user?.organizationId],
    queryFn: () => checklistInstanceService.listForToday(user?.organizationId || ''),
    enabled: !!user?.organizationId,
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });

  // Fetch team summary
  const { data: summary = [] } = useQuery({
    queryKey: ['checklist-summary-today', user?.organizationId],
    queryFn: () => checklistInstanceService.getTodaySummary(user?.organizationId || ''),
    enabled: !!user?.organizationId,
    refetchInterval: 60000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'submitted':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'verified':
        return <Badge variant="default" className="bg-success text-success-foreground">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  const calculateProgress = (instance: ChecklistInstance) => {
    if (!instance.entries || instance.entries.length === 0) {
      return 0;
    }
    const completedItems = instance.entries.filter(entry => entry.executed_status !== 'unchecked').length;
    return Math.round((completedItems / instance.entries.length) * 100);
  };

  const getTimeWindowInfo = (instance: ChecklistInstance) => {
    const windowInfo = checklistInstanceService.isWithinTimeWindow(instance);
    
    if (windowInfo.isExpired) {
      return { text: 'Expired', className: 'text-destructive' };
    }
    
    if (windowInfo.timeUntilStart && windowInfo.timeUntilStart > 0) {
      const hours = Math.floor(windowInfo.timeUntilStart / 60);
      const minutes = windowInfo.timeUntilStart % 60;
      return { 
        text: `Available in ${hours > 0 ? `${hours}h ` : ''}${minutes}m`, 
        className: 'text-muted-foreground' 
      };
    }
    
    if (windowInfo.timeUntilEnd && windowInfo.timeUntilEnd > 0) {
      const hours = Math.floor(windowInfo.timeUntilEnd / 60);
      const minutes = windowInfo.timeUntilEnd % 60;
      return { 
        text: `${hours > 0 ? `${hours}h ` : ''}${minutes}m remaining`, 
        className: 'text-warning' 
      };
    }
    
    return { text: 'Available', className: 'text-success' };
  };

  const TodaysProgressCard = () => (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Today's Progress</CardTitle>
        <CardDescription>Team checklist completion summary</CardDescription>
      </CardHeader>
      <CardContent>
        {summary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Execution</span>
                  <span className="text-sm text-muted-foreground">{item.execution_pct}%</span>
                </div>
                <Progress value={item.execution_pct} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Verification</span>
                  <span className="text-sm text-muted-foreground">{item.verification_pct}%</span>
                </div>
                <Progress value={item.verification_pct} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {item.executed_instances}/{item.total_instances} executed, {item.verified_instances}/{item.total_instances} verified
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No checklists scheduled for today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ChecklistCard = ({ instance }: { instance: ChecklistInstance }) => {
    const progress = calculateProgress(instance);
    const timeWindow = getTimeWindowInfo(instance);
    
    return (
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(instance.status)}
              <CardTitle className="text-lg">{instance.template?.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityBadge(instance.template?.priority || 'medium')}
              {getStatusBadge(instance.status)}
            </div>
          </div>
          {instance.template?.description && (
            <CardDescription>{instance.template.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Window */}
          {(instance.template?.start_time || instance.template?.end_time) && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {instance.template.start_time} - {instance.template.end_time}
              </span>
              <span className={timeWindow.className}>({timeWindow.text})</span>
            </div>
          )}
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Action Button */}
          <div className="flex justify-end">
            {instance.status === 'pending' ? (
              <Button className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Run Checklist
              </Button>
            ) : (
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Checklists</h1>
        <p className="text-muted-foreground">
          Manage and execute your daily checklists with real-time progress tracking
        </p>
      </div>

      {/* Progress Summary */}
      <TodaysProgressCard />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="my-checklists">My Checklists</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          {canManage && <TabsTrigger value="verify">Verify</TabsTrigger>}
          {canManage && <TabsTrigger value="manage">Manage</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-checklists" className="space-y-6">
          {instances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance) => (
                <ChecklistCard key={instance.id} instance={instance} />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Checklists Today</h3>
                <p className="text-muted-foreground text-center">
                  You don't have any checklists scheduled for today.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">History Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Checklist history and analytics will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {canManage && (
          <TabsContent value="verify">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Verification Interface</h3>
                <p className="text-muted-foreground text-center">
                  Checklist verification interface will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="manage">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Template Management</h3>
                <p className="text-muted-foreground text-center">
                  Checklist template creation and management will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ChecklistsPageV2;
import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { UserPlus, Calendar, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { useOnboardingInstances } from '@/hooks/onboarding/useOnboardingInstances';
import { useOnboardingTemplates } from '@/hooks/onboarding/useOnboardingTemplates';
import { useUnifiedData } from '@/contexts/UnifiedDataContext';
import { CreateOnboardingInstanceRequest, OnboardingInstanceStatus } from '@/types/onboarding';
import { format } from 'date-fns';

export function OnboardingInstanceManager() {
  const { user } = useAuth();
  const { instances, isLoading, createInstance, updateInstance } = useOnboardingInstances();
  const { templates } = useOnboardingTemplates();
  const { users } = useUnifiedData();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OnboardingInstanceStatus | 'all'>('all');

  const canManageInstances = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager';

  const filteredInstances = selectedStatus === 'all' 
    ? instances 
    : instances.filter(instance => instance.status === selectedStatus);

  const handleCreateInstance = async (data: CreateOnboardingInstanceRequest) => {
    try {
      await createInstance.mutateAsync(data);
      setCreateDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateStatus = async (instanceId: string, status: OnboardingInstanceStatus) => {
    try {
      await updateInstance.mutateAsync({ id: instanceId, status });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusColor = (status: OnboardingInstanceStatus) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'on_hold':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: OnboardingInstanceStatus) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'on_hold':
        return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!canManageInstances) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to manage onboarding instances.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Instances</h2>
          <p className="text-muted-foreground">Monitor and manage active onboarding processes</p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={selectedStatus} 
            onValueChange={(value) => setSelectedStatus(value as OnboardingInstanceStatus | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Launch Onboarding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Launch New Onboarding</DialogTitle>
              </DialogHeader>
              <LaunchInstanceForm
                templates={templates}
                users={users}
                onSubmit={handleCreateInstance}
                isSubmitting={createInstance.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredInstances.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Onboarding Instances</h3>
              <p className="text-muted-foreground mb-4">
                Launch your first onboarding process to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Launch Onboarding
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredInstances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {instance.employee?.name || 'Unknown Employee'}
                  </CardTitle>
                  <CardDescription>
                    {instance.template?.name || 'Custom Onboarding'} • Started {format(new Date(instance.start_date), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(instance.status)} text-white`}
                  >
                    <span className="flex items-center gap-1">
                      {getStatusIcon(instance.status)}
                      {instance.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </Badge>
                  <Select 
                    value={instance.status} 
                    onValueChange={(status) => handleUpdateStatus(instance.id, status as OnboardingInstanceStatus)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {instance.tasks?.filter(t => t.status === 'completed').length || 0} / {instance.tasks?.length || 0} tasks
                    </span>
                  </div>
                  <Progress 
                    value={instance.tasks?.length ? 
                      (instance.tasks.filter(t => t.status === 'completed').length / instance.tasks.length) * 100 
                      : 0
                    } 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{instance.employee?.email}</span>
                    <span>Role: {instance.employee?.role || 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

interface LaunchInstanceFormProps {
  templates: any[];
  users: any[];
  onSubmit: (data: CreateOnboardingInstanceRequest) => void;
  isSubmitting: boolean;
}

function LaunchInstanceForm({ templates, users, onSubmit, isSubmitting }: LaunchInstanceFormProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employee_id: employeeId,
      template_id: templateId || undefined,
      start_date: startDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee">Employee</Label>
        <Select value={employeeId} onValueChange={setEmployeeId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select an employee..." />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Template (Optional)</Label>
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a template or create custom..." />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="custom">Custom Onboarding</SelectItem>
            {templates.length === 0 ? (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                No templates available
              </div>
            ) : (
              templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name || 'Unnamed Template'}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {templates.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Create templates in the Templates tab to use them here.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="start-date">Start Date</Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Launching...' : 'Launch Onboarding'}
        </Button>
      </div>
    </form>
  );
}

export default OnboardingInstanceManager;
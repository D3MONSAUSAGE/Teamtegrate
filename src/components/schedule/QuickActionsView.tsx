import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Clock, 
  Plus, 
  Copy, 
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings,
  FileText,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const QuickActionsView: React.FC = () => {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Mock data for demonstration
  const scheduleTemplates = [
    {
      id: '1',
      name: 'Standard Week',
      description: 'Monday-Friday, 9-5 schedule',
      shifts: 5,
      totalHours: 40
    },
    {
      id: '2', 
      name: 'Weekend Coverage',
      description: 'Saturday-Sunday shifts',
      shifts: 2,
      totalHours: 16
    },
    {
      id: '3',
      name: 'Holiday Schedule', 
      description: 'Reduced hours for holidays',
      shifts: 3,
      totalHours: 24
    }
  ];

  const pendingActions = [
    {
      id: '1',
      type: 'approval',
      title: 'Time Entry Approval',
      description: '3 pending time entries need review',
      priority: 'high',
      count: 3
    },
    {
      id: '2',
      type: 'coverage',
      title: 'Coverage Gap',
      description: 'Sunday shift needs coverage',
      priority: 'medium', 
      count: 1
    },
    {
      id: '3',
      type: 'schedule',
      title: 'Schedule Conflicts',
      description: '2 scheduling conflicts to resolve',
      priority: 'high',
      count: 2
    }
  ];

  const handleQuickAction = (action: string) => {
    toast.success(`${action} action initiated`);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    toast.success('Template selected. Configure details to proceed.');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
      case 'low':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">Low</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-accent/20 to-primary/20">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Streamlined shortcuts for common management tasks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Action Required
            </CardTitle>
            <CardDescription>
              Items that need your immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors hover:shadow-sm ${getPriorityColor(action.priority)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background/50">
                    {action.type === 'approval' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    {action.type === 'coverage' && <Users className="h-4 w-4 text-orange-600" />}
                    {action.type === 'schedule' && <Calendar className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(action.priority)}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleQuickAction(action.title)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Create Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Quick Create
            </CardTitle>
            <CardDescription>
              Rapidly create schedules and assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('New Schedule')}
            >
              <Calendar className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">New Schedule</div>
                <div className="text-xs text-muted-foreground">Create from scratch</div>
              </div>
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('Bulk Assignment')}
            >
              <Users className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Bulk Assignment</div>
                <div className="text-xs text-muted-foreground">Assign multiple shifts</div>
              </div>
            </Button>

            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('Copy Last Week')}
            >
              <Copy className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Copy Last Week</div>
                <div className="text-xs text-muted-foreground">Duplicate previous schedule</div>
              </div>
            </Button>

            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('Emergency Coverage')}
            >
              <AlertTriangle className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Emergency Coverage</div>
                <div className="text-xs text-muted-foreground">Find immediate replacements</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Schedule Templates
          </CardTitle>
          <CardDescription>
            Pre-configured schedule patterns for quick deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scheduleTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-primary/50 bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm">{template.name}</h4>
                      {selectedTemplate === template.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{template.shifts} shifts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{template.totalHours}h total</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedTemplate && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">
                    Template Selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Configure the details and deploy to your team
                  </p>
                </div>
                <Button size="sm" onClick={() => handleQuickAction('Deploy Template')}>
                  Deploy Template
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Bulk Operations
          </CardTitle>
          <CardDescription>
            Perform actions on multiple items at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('Bulk Approve')}
            >
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div className="text-center">
                <div className="font-medium text-xs">Bulk Approve</div>
                <div className="text-xs text-muted-foreground">Approve all pending</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('Bulk Assign')}
            >
              <UserCheck className="h-6 w-6 text-blue-600" />
              <div className="text-center">
                <div className="font-medium text-xs">Bulk Assign</div>
                <div className="text-xs text-muted-foreground">Assign to multiple users</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('Bulk Notify')}
            >
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div className="text-center">
                <div className="font-medium text-xs">Bulk Notify</div>
                <div className="text-xs text-muted-foreground">Send notifications</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleQuickAction('Export Data')}
            >
              <FileText className="h-6 w-6 text-purple-600" />
              <div className="text-center">
                <div className="font-medium text-xs">Export Data</div>
                <div className="text-xs text-muted-foreground">Download reports</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Database, Shield, Users } from 'lucide-react';

const DataMigrationStatus: React.FC = () => {
  const migrationSteps = [
    {
      phase: "Phase 1",
      title: "Core RLS Setup",
      description: "Projects, tasks, and users tables",
      status: "completed" as const,
      icon: Shield
    },
    {
      phase: "Phase 2", 
      title: "Project Team Security",
      description: "Project team member isolation",
      status: "completed" as const,
      icon: Users
    },
    {
      phase: "Phase 3",
      title: "Authentication Integration", 
      description: "User session and organization helpers",
      status: "completed" as const,
      icon: Shield
    },
    {
      phase: "Phase 4",
      title: "Complete Table Coverage",
      description: "All remaining tables secured",
      status: "completed" as const,
      icon: Database
    },
    {
      phase: "Phase 5",
      title: "Data Migration & Cleanup",
      description: "All existing data properly organized", 
      status: "completed" as const,
      icon: CheckCircle
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">✅ Completed</Badge>;
      case 'in-progress':
        return <Badge variant="secondary">🔄 In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">⏳ Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-green-500" />
          Multi-Tenant Migration Status
        </CardTitle>
        <CardDescription>
          Progress of organization isolation and data security implementation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {migrationSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{step.phase}: {step.title}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                  </div>
                </div>
                {getStatusBadge(step.status)}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Migration Complete!</span>
          </div>
          <p className="text-sm text-green-700">
            All phases have been successfully completed. Your application now has full multi-tenant 
            organization isolation with Row Level Security protecting all data access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataMigrationStatus;

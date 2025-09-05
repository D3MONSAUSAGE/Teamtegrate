import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Briefcase, 
  Info, 
  Shield, 
  Building2 
} from 'lucide-react';
import { SystemRoleManager } from './SystemRoleManager';
import { JobRoleManager } from './JobRoleManager';

export const EnhancedRoleManager: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role & Permission Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage both system permissions and organizational job roles for your team
          </p>
        </div>
      </div>

      {/* Overview Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Two Types of Roles:</strong> System roles control access permissions (who can do what), 
          while job roles define organizational positions (what someone's job is). A user can have multiple job roles but only one system role.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System Permissions
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Organizational Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Role Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                System roles determine what users can access and manage within the platform. 
                Each user has exactly one system role that controls their permissions.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">What System Roles Control:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Access to admin panels and settings</li>
                    <li>• Ability to manage other users</li>
                    <li>• Permission to view sensitive data</li>
                    <li>• Authority to make system changes</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Role Assignment Rules:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Each user has exactly one system role</li>
                    <li>• Higher roles can manage lower roles</li>
                    <li>• Role changes require approval</li>
                    <li>• Some roles require special permissions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <SystemRoleManager />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Job Role Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Job roles represent positions and functions within your organization structure. 
                Users can have multiple job roles that reflect their responsibilities.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">What Job Roles Define:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Organizational position titles</li>
                    <li>• Job responsibilities and duties</li>
                    <li>• Team or department assignments</li>
                    <li>• Reporting relationships</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Job Role Examples:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Kitchen Manager, Line Cook, Server</li>
                    <li>• Sales Associate, Customer Service Rep</li>
                    <li>• Project Manager, Developer, Designer</li>
                    <li>• Shift Supervisor, Team Lead</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <JobRoleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
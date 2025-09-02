import React, { useMemo, useState } from 'react';
import { useAccessControlData } from '@/hooks/access-control/useAccessControlData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, UserCog, Briefcase } from 'lucide-react';

const AccessControlManager: React.FC = () => {
  const { user } = useAuth();
  const {
    schema,
    roles,
    users,
    jobRoles,
    grantsForRole,
    grantsForJobRole,
    grantsForUser,
    upsertRolePermission,
    upsertJobRolePermission,
    upsertUserOverride,
    isSuperadmin,
    loading,
    error
  } = useAccessControlData();

  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [selectedJobRole, setSelectedJobRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  const currentUserRole = user?.role;
  const viewOnly = !isSuperadmin;

  const selectedJobRoleId = useMemo(() => selectedJobRole || jobRoles[0]?.id || '', [jobRoles, selectedJobRole]);
  const selectedUserId = useMemo(() => selectedUser || users?.[0]?.id || '', [users, selectedUser]);

  return (
    <section aria-label="Access Control">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">Access Control</h2>
        <p className="text-sm text-muted-foreground">Manage module permissions by role, job role, or individual user.</p>
      </header>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {viewOnly && (
        <Alert className="mb-4">
          <AlertDescription>View only. Only superadmins can modify permissions.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Roles</TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Job roles</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2"><UserCog className="h-4 w-4" /> Individuals</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Role-based permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm mb-4">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      {schema[0]?.actions.map(a => (
                        <TableHead key={a.id} className="text-center">{a.display_name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schema.map(({ module, actions }) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.display_name}</TableCell>
                        {actions.map(action => {
                          const key = `${module.id}:${action.id}:${selectedRole}`;
                          const checked = grantsForRole.get(key) ?? false;
                          return (
                            <TableCell key={action.id} className="text-center">
                              <Switch
                                checked={!!checked}
                                onCheckedChange={(val) => upsertRolePermission(selectedRole as any, module.id, action.id, val)}
                                disabled={viewOnly || loading}
                                aria-label={`Toggle ${action.display_name} for ${module.display_name}`}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job role permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm mb-4">
                <Select value={selectedJobRoleId} onValueChange={setSelectedJobRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job role" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRoles.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      {schema[0]?.actions.map(a => (
                        <TableHead key={a.id} className="text-center">{a.display_name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schema.map(({ module, actions }) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.display_name}</TableCell>
                        {actions.map(action => {
                          const key = `${module.id}:${action.id}:${selectedJobRoleId}`;
                          const checked = grantsForJobRole.get(key) ?? false;
                          return (
                            <TableCell key={action.id} className="text-center">
                              <Switch
                                checked={!!checked}
                                onCheckedChange={(val) => upsertJobRolePermission(selectedJobRoleId, module.id, action.id, val)}
                                disabled={viewOnly || loading || !selectedJobRoleId}
                                aria-label={`Toggle ${action.display_name} for ${module.display_name}`}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual overrides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm mb-4">
                <Select value={selectedUserId} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      {schema[0]?.actions.map(a => (
                        <TableHead key={a.id} className="text-center">{a.display_name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schema.map(({ module, actions }) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.display_name}</TableCell>
                        {actions.map(action => {
                          const key = `${module.id}:${action.id}:${selectedUserId}`;
                          const checked = grantsForUser.get(key) ?? false;
                          return (
                            <TableCell key={action.id} className="text-center">
                              <Switch
                                checked={!!checked}
                                onCheckedChange={(val) => upsertUserOverride(selectedUserId, module.id, action.id, val)}
                                disabled={viewOnly || loading || !selectedUserId}
                                aria-label={`Toggle ${action.display_name} for ${module.display_name}`}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default AccessControlManager;

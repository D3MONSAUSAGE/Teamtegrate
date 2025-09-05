import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Crown, 
  Shield, 
  Users, 
  User, 
  Search, 
  Info,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { UserRole } from '@/types';
import RoleSelector from './user-management/RoleSelector';
import { useAuth } from '@/contexts/AuthContext';

interface RoleHierarchyInfo {
  role: UserRole;
  level: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  permissions: string[];
  canManage: UserRole[];
}

const roleHierarchy: RoleHierarchyInfo[] = [
  {
    role: 'superadmin',
    level: 4,
    icon: <Crown className="h-5 w-5 text-warning" />,
    title: 'Super Administrator',
    description: 'Full system access with complete administrative control',
    permissions: [
      'Complete system administration',
      'Manage all users and roles',
      'Access all data and settings',
      'Transfer superadmin role',
      'Delete organization data'
    ],
    canManage: ['admin', 'manager', 'team_leader', 'user']
  },
  {
    role: 'admin',
    level: 3,
    icon: <Shield className="h-5 w-5 text-destructive" />,
    title: 'Administrator',
    description: 'High-level administrative access to most system functions',
    permissions: [
      'Manage organization settings',
      'Create and manage teams',
      'Assign roles to users',
      'Access analytics and reports',
      'Manage billing and subscriptions'
    ],
    canManage: ['manager', 'team_leader', 'user']
  },
  {
    role: 'manager',
    level: 2,
    icon: <Users className="h-5 w-5 text-info" />,
    title: 'Manager',
    description: 'Team and project management with departmental oversight',
    permissions: [
      'Manage assigned teams',
      'Create and assign projects',
      'View team performance metrics',
      'Approve time-off requests',
      'Access team reports'
    ],
    canManage: ['team_leader', 'user']
  },
  {
    role: 'team_leader',
    level: 2.5,
    icon: <Shield className="h-5 w-5 text-secondary" />,
    title: 'Team Leader',
    description: 'Lead specific teams with focused management responsibilities',
    permissions: [
      'Lead assigned team members',
      'Assign and track team tasks',
      'Conduct team meetings',
      'Report to managers',
      'Mentor team members'
    ],
    canManage: ['user']
  },
  {
    role: 'user',
    level: 1,
    icon: <User className="h-5 w-5 text-muted-foreground" />,
    title: 'Team Member',
    description: 'Standard access for completing tasks and collaborating',
    permissions: [
      'Complete assigned tasks',
      'Participate in team projects',
      'Access shared resources',
      'View own performance data',
      'Communicate with team'
    ],
    canManage: []
  }
];

export const SystemRoleManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, isLoading, changeUserRole, validateRoleChange } = useEnhancedUserManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [changingRoles, setChangingRoles] = useState<Set<string>>(new Set());

  const isSuperadmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser && ['superadmin', 'admin'].includes(currentUser.role);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const validation = await validateRoleChange(userId, newRole);
    
    if (!validation.allowed) {
      // Handle role change validation (e.g., show transfer dialog for superadmin)
      return;
    }

    setChangingRoles(prev => new Set(prev).add(userId));
    try {
      await changeUserRole(userId, newRole);
    } finally {
      setChangingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getRoleStats = () => {
    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);
    
    return roleHierarchy.map(roleInfo => ({
      ...roleInfo,
      count: stats[roleInfo.role] || 0
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            System Permissions & Roles
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage user access levels and system permissions within your organization
          </p>
        </div>
      </div>

      {/* Role Hierarchy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Role Hierarchy & Permissions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Understanding system roles and their access levels
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getRoleStats().map((roleInfo) => (
              <Card key={roleInfo.role} className="relative border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {roleInfo.icon}
                      <h3 className="font-semibold">{roleInfo.title}</h3>
                    </div>
                    <Badge variant={roleInfo.count > 0 ? "default" : "outline"}>
                      {roleInfo.count}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {roleInfo.description}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Key Permissions:</strong>
                    <ul className="mt-1 space-y-1">
                      {roleInfo.permissions.slice(0, 2).map((permission, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-success" />
                          {permission}
                        </li>
                      ))}
                      {roleInfo.permissions.length > 2 && (
                        <li className="text-muted-foreground">
                          +{roleInfo.permissions.length - 2} more...
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> System roles determine what users can access and manage within your organization. 
          Changes to user roles take effect immediately and cannot be undone without proper authorization.
          {!isSuperadmin && " Only superadmins can modify admin roles."}
        </AlertDescription>
      </Alert>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>User Role Management</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                {roleHierarchy.map(role => (
                  <option key={role.role} value={role.role}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Permissions Level</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const roleInfo = roleHierarchy.find(r => r.role === user.role);
                const isChanging = changingRoles.has(user.id);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {roleInfo?.icon}
                        <div>
                          <Badge variant={user.role === 'superadmin' ? 'default' : 'outline'}>
                            {roleInfo?.title || user.role}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Level {roleInfo?.level || 1}
                        <p className="text-xs text-muted-foreground">
                          Can manage: {roleInfo?.canManage.length ? 
                            roleInfo.canManage.join(', ') : 'None'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.id !== currentUser?.id && isAdmin ? (
                        <RoleSelector
                          availableRoles={roleHierarchy
                            .filter(r => {
                              if (!isSuperadmin && r.role === 'superadmin') return false;
                              if (!isSuperadmin && user.role === 'superadmin') return false;
                              return true;
                            })
                            .map(r => r.role)
                          }
                          isChangingRole={isChanging}
                          onRoleSelect={(role) => handleRoleChange(user.id, role)}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {user.id === currentUser?.id ? 'You' : 'No access'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
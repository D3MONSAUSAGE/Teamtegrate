import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, Filter, Clock, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  action_type: string;
  target_user_id: string;
  target_user_email: string;
  target_user_name: string;
  performed_by_user_id: string;
  performed_by_email: string;
  old_values: any;
  new_values: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const AdminAuditLog: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');

  const isAdmin = currentUser && ['admin', 'superadmin'].includes(currentUser.role);

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [isAdmin, dateFilter]);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, actionTypeFilter]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date filter
      let dateFrom = new Date();
      switch (dateFilter) {
        case '1day':
          dateFrom.setDate(dateFrom.getDate() - 1);
          break;
        case '7days':
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case '30days':
          dateFrom.setDate(dateFrom.getDate() - 30);
          break;
        case '90days':
          dateFrom.setDate(dateFrom.getDate() - 90);
          break;
        default:
          dateFrom.setDate(dateFrom.getDate() - 7);
      }

      const { data, error } = await supabase
        .from('user_management_audit')
        .select('*')
        .eq('organization_id', currentUser?.organizationId)
        .gte('created_at', dateFrom.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to fetch audit logs');
        return;
      }

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...auditLogs];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.target_user_email.toLowerCase().includes(term) ||
        log.target_user_name.toLowerCase().includes(term) ||
        log.performed_by_email.toLowerCase().includes(term) ||
        log.action_type.toLowerCase().includes(term)
      );
    }

    // Action type filter
    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionTypeFilter);
    }

    setFilteredLogs(filtered);
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'role_change':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatChanges = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return 'No changes recorded';
    
    const changes = [];
    
    if (oldValues && newValues) {
      Object.keys(newValues).forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          changes.push(`${key}: "${oldValues[key]}" → "${newValues[key]}"`);
        }
      });
    } else if (newValues) {
      Object.keys(newValues).forEach(key => {
        changes.push(`${key}: "${newValues[key]}"`);
      });
    }

    return changes.length > 0 ? changes.join(', ') : 'No specific changes';
  };

  const uniqueActionTypes = [...new Set(auditLogs.map(log => log.action_type))];

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Only administrators can access audit logs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Management Audit Log
          <Badge variant="outline" className="ml-auto">
            {filteredLogs.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, email, or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActionTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">Last 24 hours</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={fetchAuditLogs}
              variant="outline"
              disabled={isLoading}
              className="px-3"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Audit Log Table */}
          <div className="border rounded-md">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-2">Loading audit logs...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {auditLogs.length === 0 ? 'No audit logs found' : 'No logs match your filters'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action_type)}>
                            {log.action_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <div>
                              <div className="font-medium text-sm">{log.target_user_name}</div>
                              <div className="text-xs text-muted-foreground">{log.target_user_email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{log.performed_by_email}</div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-xs text-muted-foreground truncate" title={formatChanges(log.old_values, log.new_values)}>
                            {formatChanges(log.old_values, log.new_values)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
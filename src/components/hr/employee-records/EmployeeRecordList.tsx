import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye, Search, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import EmployeeRecordViewerModal from './EmployeeRecordViewerModal';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

interface EmployeeRecordListProps {
  refreshTrigger: number;
}

const DOCUMENT_TYPES = {
  contract: 'Contract',
  id: 'ID Document',
  tax_form: 'Tax Form',
  certification: 'Certification',
  performance_review: 'Performance Review',
  other: 'Other',
};

const EmployeeRecordList: React.FC<EmployeeRecordListProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const { users } = useEnhancedUserManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const isManager = hasRoleAccess(user?.role, 'manager');

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['employee-records', user?.organizationId, refreshTrigger],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_records')
        .select('*')
        .eq('organization_id', user?.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = 
        record.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.uploader_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEmployee = employeeFilter === 'all' || record.employee_id === employeeFilter;
      const matchesType = typeFilter === 'all' || record.document_type === typeFilter;

      return matchesSearch && matchesEmployee && matchesType;
    });
  }, [records, searchTerm, employeeFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const expiringSoon = records.filter(r => {
      if (!r.expiry_date) return false;
      const expiryDate = parseISO(r.expiry_date);
      const thirtyDaysFromNow = addDays(new Date(), 30);
      return isBefore(expiryDate, thirtyDaysFromNow) && !isBefore(expiryDate, new Date());
    }).length;
    const expired = records.filter(r => {
      if (!r.expiry_date) return false;
      return isBefore(parseISO(r.expiry_date), new Date());
    }).length;

    return { total, expiringSoon, expired };
  }, [records]);

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setViewerOpen(true);
  };

  const handleDownload = async (record: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('employee-records')
        .download(record.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (record: any) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('employee-records')
        .remove([record.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('employee_records')
        .delete()
        .eq('id', record.id);

      if (dbError) throw dbError;

      toast.success('Record deleted successfully');
      refetch();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete record');
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = users.find(u => u.id === employeeId);
    return employee?.name || employee?.email || 'Unknown';
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return isBefore(parseISO(expiryDate), new Date());
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = parseISO(expiryDate);
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return isBefore(expiry, thirtyDaysFromNow) && !isBefore(expiry, new Date());
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Records</CardTitle>
            <CardDescription>
              View and manage all employee documents and records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by document name, file name, or uploader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {users.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name || employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading records...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No employee records found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Doc Date</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(record.employee_id)}
                        </TableCell>
                        <TableCell>{record.document_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {DOCUMENT_TYPES[record.document_type as keyof typeof DOCUMENT_TYPES]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.document_date ? format(parseISO(record.document_date), 'PP') : '-'}
                        </TableCell>
                        <TableCell>
                          {record.expiry_date ? (
                            <div className="flex items-center gap-1">
                              {isExpired(record.expiry_date) && (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              )}
                              {isExpiringSoon(record.expiry_date) && !isExpired(record.expiry_date) && (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className={
                                isExpired(record.expiry_date) ? 'text-red-600' :
                                isExpiringSoon(record.expiry_date) ? 'text-yellow-600' : ''
                              }>
                                {format(parseISO(record.expiry_date), 'PP')}
                              </span>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{record.uploader_name}</TableCell>
                        <TableCell>{format(parseISO(record.created_at), 'PP')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(record)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {isManager && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(record)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EmployeeRecordViewerModal
        record={selectedRecord}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </>
  );
};

export default EmployeeRecordList;

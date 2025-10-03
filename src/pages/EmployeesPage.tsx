import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EmployeesHeader from '@/components/employees/EmployeesHeader';
import EmployeesToolbar from '@/components/employees/EmployeesToolbar';
import EmployeesDataTable from '@/components/employees/EmployeesDataTable';
import CreateEmployeeDialog from '@/components/employees/CreateEmployeeDialog';
import EditEmployeeDialog from '@/components/employees/EditEmployeeDialog';
import DeleteEmployeeDialog from '@/components/employees/DeleteEmployeeDialog';
import EmployeeDetailsDialog from '@/components/employees/EmployeeDetailsDialog';
import { Loader2 } from 'lucide-react';

export interface EmployeeFilters {
  search?: string;
  teamId?: string;
  role?: string;
  department?: string;
  status?: string;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<EmployeeFilters>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isManager = user?.role === 'manager' || isAdmin;

  if (!isManager) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have access to this page.</p>
        </div>
      </div>
    );
  }

  const handleViewDetails = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setEditDialogOpen(true);
  };

  const handleDelete = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <EmployeesHeader 
        onCreateClick={() => setCreateDialogOpen(true)}
        canCreate={isAdmin}
      />
      
      <EmployeesToolbar 
        filters={filters}
        onFiltersChange={setFilters}
        isManager={!isAdmin}
      />
      
      <div className="flex-1 overflow-auto">
        <EmployeesDataTable 
          filters={filters}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={isAdmin}
          canDelete={isAdmin}
        />
      </div>

      <CreateEmployeeDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedEmployeeId && (
        <>
          <EditEmployeeDialog 
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            employeeId={selectedEmployeeId}
          />

          <DeleteEmployeeDialog 
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            employeeId={selectedEmployeeId}
          />

          <EmployeeDetailsDialog 
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            employeeId={selectedEmployeeId}
          />
        </>
      )}
    </div>
  );
}

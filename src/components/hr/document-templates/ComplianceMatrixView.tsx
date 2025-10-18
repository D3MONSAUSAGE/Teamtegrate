import { useState, useMemo } from 'react';
import { useComplianceTracking } from '@/hooks/document-templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Clock, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DocumentComplianceDialog } from './DocumentComplianceDialog';
import type { DocumentComplianceTracking } from '@/types/document-templates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig = {
  compliant: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Compliant' },
  missing: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Missing' },
  expired: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Expired' },
  expiring_soon: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Expiring Soon' },
  pending_verification: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Pending' },
};

export const ComplianceMatrixView = () => {
  const { matrixData, stats, isLoading } = useComplianceTracking();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedCompliance, setSelectedCompliance] = useState<{
    compliance: DocumentComplianceTracking;
    employeeName: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Group requirements by template (acting as category)
  const categorizedRequirements = useMemo(() => {
    if (!matrixData) return {};
    
    return matrixData.requirements.reduce((acc, req) => {
      const category = req.template_name || 'Other Documents';
      if (!acc[category]) acc[category] = [];
      acc[category].push(req);
      return acc;
    }, {} as Record<string, typeof matrixData.requirements>);
  }, [matrixData]);

  // Filter employees based on selection (show all if none selected, or limit to selection)
  const visibleEmployees = useMemo(() => {
    if (!matrixData) return [];
    if (selectedEmployees.length === 0) {
      // Show first 8 employees by default
      return matrixData.employees.slice(0, 8);
    }
    return matrixData.employees.filter(emp => selectedEmployees.includes(emp.id));
  }, [matrixData, selectedEmployees]);

  // Filter requirements by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categorizedRequirements;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof matrixData.requirements> = {};
    
    Object.entries(categorizedRequirements).forEach(([category, reqs]) => {
      const matchingReqs = reqs.filter(req => 
        req.name.toLowerCase().includes(query)
      );
      if (matchingReqs.length > 0) {
        filtered[category] = matchingReqs;
      }
    });
    
    return filtered;
  }, [categorizedRequirements, searchQuery]);

  const handleCellClick = (compliance: DocumentComplianceTracking, employeeName: string) => {
    setSelectedCompliance({ compliance, employeeName });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="text-center py-8">Loading compliance data...</div>;
  if (!matrixData) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats?.compliant || 0}</div>
            <p className="text-sm text-muted-foreground">Compliant</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats?.missing || 0}</div>
            <p className="text-sm text-muted-foreground">Missing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats?.expired || 0}</div>
            <p className="text-sm text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats?.expiring_soon || 0}</div>
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.compliance_rate.toFixed(0) || 0}%</div>
            <p className="text-sm text-muted-foreground">Compliance Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedEmployees.length > 0 ? selectedEmployees[0] : 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedEmployees([]);
                } else {
                  setSelectedEmployees([value]);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees (First 8)</SelectItem>
                {matrixData.employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} - {emp.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vertical Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Compliance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold min-w-[200px] sticky left-0 bg-muted/50 z-10">
                    Document
                  </th>
                  {visibleEmployees.map((employee) => (
                    <th key={employee.id} className="text-center p-3 font-semibold min-w-[120px]">
                      <div className="text-sm font-medium">{employee.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">{employee.role}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(filteredCategories).map(([category, requirements]) => (
                  <>
                    {/* Category Header Row */}
                    <tr key={`category-${category}`} className="bg-primary">
                      <td
                        colSpan={visibleEmployees.length + 1}
                        className="p-3 text-primary-foreground font-semibold text-sm uppercase tracking-wide"
                      >
                        {category}
                      </td>
                    </tr>
                    {/* Document Rows */}
                    {requirements.map((req, idx) => (
                      <tr
                        key={req.id}
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        <td className="p-3 font-medium sticky left-0 bg-inherit z-10">
                          {req.name}
                        </td>
                        {visibleEmployees.map((employee) => {
                          const compliance = matrixData.compliance.get(employee.id)?.get(req.id);
                          if (!compliance) {
                            return (
                              <td key={`${employee.id}-${req.id}`} className="p-3 text-center">
                                <div className="text-muted-foreground">-</div>
                              </td>
                            );
                          }
                          const config = statusConfig[compliance.compliance_status];
                          const Icon = config.icon;
                          return (
                            <td key={`${employee.id}-${req.id}`} className="p-3 text-center">
                              <button
                                onClick={() => handleCellClick(compliance, employee.name)}
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${config.bg} hover:ring-2 hover:ring-offset-2 hover:ring-primary transition-all cursor-pointer`}
                                title={`${config.label} - Click for details`}
                              >
                                <Icon className={`w-5 h-5 ${config.color}`} />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          
          {visibleEmployees.length < matrixData.employees.length && selectedEmployees.length === 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {visibleEmployees.length} of {matrixData.employees.length} employees. 
                Use the filter above to view specific employees.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Detail Dialog */}
      <DocumentComplianceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        compliance={selectedCompliance?.compliance || null}
        employeeName={selectedCompliance?.employeeName || ''}
      />
    </div>
  );
};

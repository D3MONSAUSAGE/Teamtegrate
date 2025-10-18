import { useComplianceTracking } from '@/hooks/document-templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Clock, FileQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  compliant: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Compliant' },
  missing: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Missing' },
  expired: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Expired' },
  expiring_soon: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Expiring Soon' },
  pending_verification: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Pending' },
};

export const ComplianceMatrixView = () => {
  const { matrixData, stats, isLoading } = useComplianceTracking();

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

      {/* Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Compliance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Employee</th>
                  {matrixData.requirements.map((req) => (
                    <th key={req.id} className="text-center p-3 font-semibold min-w-[100px]">
                      <div className="text-xs">{req.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.employees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">{employee.role}</div>
                    </td>
                    {matrixData.requirements.map((req) => {
                      const compliance = matrixData.compliance.get(employee.id)?.get(req.id);
                      if (!compliance) return <td key={req.id} className="p-3 text-center">-</td>;
                      const config = statusConfig[compliance.compliance_status];
                      const Icon = config.icon;
                      return (
                        <td key={req.id} className="p-3 text-center">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.bg}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

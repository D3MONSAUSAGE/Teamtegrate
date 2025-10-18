import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { DocumentComplianceTracking, ComplianceMatrixData, ComplianceStats } from '@/types/document-templates';

export const useComplianceTracking = (employeeId?: string) => {
  const { user } = useAuth();

  const { data: complianceData, isLoading } = useQuery({
    queryKey: ['compliance-tracking', user?.organizationId, employeeId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization ID');

      let query = supabase
        .from('document_compliance_tracking' as any)
        .select('*')
        .eq('organization_id', user.organizationId);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as DocumentComplianceTracking[];
    },
    enabled: !!user?.organizationId,
  });

  // Transform data into matrix format
  const matrixData: ComplianceMatrixData | null = complianceData
    ? {
        employees: Array.from(
          new Map(
            complianceData.map(d => [
              d.employee_id,
              { id: d.employee_id, name: d.employee_name, role: d.employee_role },
            ])
          ).values()
        ),
        requirements: Array.from(
          new Map(
            complianceData.map(d => [
              d.requirement_id,
              { id: d.requirement_id, name: d.document_name, template_name: d.template_name },
            ])
          ).values()
        ),
        compliance: complianceData.reduce((acc, item) => {
          if (!acc.has(item.employee_id)) {
            acc.set(item.employee_id, new Map());
          }
          acc.get(item.employee_id)!.set(item.requirement_id, item);
          return acc;
        }, new Map<string, Map<string, DocumentComplianceTracking>>()),
      }
    : null;

  // Calculate compliance statistics
  const stats: ComplianceStats | null = complianceData
    ? {
        total_requirements: complianceData.length,
        compliant: complianceData.filter(d => d.compliance_status === 'compliant').length,
        missing: complianceData.filter(d => d.compliance_status === 'missing').length,
        expired: complianceData.filter(d => d.compliance_status === 'expired').length,
        expiring_soon: complianceData.filter(d => d.compliance_status === 'expiring_soon').length,
        pending_verification: complianceData.filter(d => d.compliance_status === 'pending_verification').length,
        compliance_rate: complianceData.length
          ? (complianceData.filter(d => d.compliance_status === 'compliant').length / complianceData.length) * 100
          : 0,
      }
    : null;

  return {
    complianceData: complianceData || [],
    matrixData,
    stats,
    isLoading,
  };
};

// Hook for employee to see their own document checklist
export const useMyDocumentChecklist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-document-checklist', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('document_compliance_tracking' as any)
        .select('*')
        .eq('employee_id', user.id)
        .order('is_required', { ascending: false })
        .order('document_name');

      if (error) throw error;
      return data as unknown as DocumentComplianceTracking[];
    },
    enabled: !!user?.id,
  });
};

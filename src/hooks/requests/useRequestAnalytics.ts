import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, format } from 'date-fns';

export interface RequestAnalytics {
  id: string;
  organization_id: string;
  request_id: string;
  request_type_id: string;
  event_type: string;
  event_timestamp: string;
  user_id: string;
  processing_time_minutes: number | null;
  approver_id: string | null;
  previous_status: string | null;
  new_status: string | null;
  metadata: any;
  created_at: string;
}

export interface AnalyticsMetrics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageProcessingTime: number;
  completionRate: number;
  slaBreaches: number;
  topRequestTypes: Array<{ type: string; count: number }>;
  processingTimeByType: Array<{ type: string; avgTime: number }>;
  requestVolumeTrend: Array<{ date: string; count: number }>;
  approverPerformance: Array<{ approver: string; count: number; avgTime: number }>;
}

export const useRequestAnalytics = (timeRange: number = 30) => {
  const [analytics, setAnalytics] = useState<RequestAnalytics[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.organizationId) return;

      const startDate = subDays(new Date(), timeRange);

      // Fetch analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('request_analytics')
        .select('*')
        .eq('organization_id', user.organizationId)
        .gte('event_timestamp', startDate.toISOString())
        .order('event_timestamp', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Fetch requests data for metrics calculation
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          priority,
          created_at,
          submitted_at,
          completed_at,
          sla_breached,
          request_type:request_types(name)
        `)
        .eq('organization_id', user.organizationId)
        .gte('created_at', startDate.toISOString());

      if (requestsError) throw requestsError;

      setAnalytics(analyticsData || []);

      // Calculate metrics
      const totalRequests = requestsData?.length || 0;
      const pendingRequests = requestsData?.filter(r => r.status === 'submitted' || r.status === 'under_review').length || 0;
      const approvedRequests = requestsData?.filter(r => r.status === 'approved' || r.status === 'completed').length || 0;
      const rejectedRequests = requestsData?.filter(r => r.status === 'rejected').length || 0;
      const slaBreaches = requestsData?.filter(r => r.sla_breached).length || 0;

      // Calculate average processing time
      const completedRequests = requestsData?.filter(r => r.completed_at && r.submitted_at) || [];
      const totalProcessingTime = completedRequests.reduce((sum, r) => {
        const submitted = new Date(r.submitted_at!);
        const completed = new Date(r.completed_at!);
        return sum + (completed.getTime() - submitted.getTime()) / (1000 * 60); // minutes
      }, 0);
      const averageProcessingTime = completedRequests.length > 0 ? totalProcessingTime / completedRequests.length : 0;

      // Calculate completion rate
      const completionRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

      // Top request types
      const typeCount = (requestsData || []).reduce((acc, r) => {
        const typeName = r.request_type?.name || 'Unknown';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topRequestTypes = Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Request volume trend (last 7 days)
      const requestVolumeTrend = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        const dayRequests = requestsData?.filter(r => 
          format(new Date(r.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ).length || 0;
        return {
          date: format(date, 'MMM dd'),
          count: dayRequests
        };
      }).reverse();

      setMetrics({
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        averageProcessingTime: Math.round(averageProcessingTime),
        completionRate: Math.round(completionRate),
        slaBreaches,
        topRequestTypes,
        processingTimeByType: [], // TODO: Calculate this
        requestVolumeTrend,
        approverPerformance: [], // TODO: Calculate this
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organizationId) {
      fetchAnalytics();
    }
  }, [user?.organizationId, timeRange]);

  return {
    analytics,
    metrics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
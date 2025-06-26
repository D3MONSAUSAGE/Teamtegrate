
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { networkManager } from '@/utils/networkManager';
import { getUploadMetrics } from '../invoice-upload/InvoiceUploadHelpers';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  HardDrive, 
  Network, 
  TrendingUp,
  Zap
} from 'lucide-react';

interface SystemMetrics {
  networkHealth: {
    status: 'healthy' | 'degraded' | 'offline';
    failureRate: number;
    avgResponseTime: number;
    activeRequests: number;
    queuedRequests: number;
  };
  uploadMetrics: {
    activeUploads: number;
    recentFailures: number;
    avgUploadTime: number;
    totalUploadsToday: number;
  };
  storageHealth: {
    accessible: boolean;
    responseTime: number;
    lastChecked: Date;
  };
  performanceMetrics: {
    memoryUsage: number;
    cpuLoad: number;
    cacheHitRate: number;
  };
}

const InvoiceSystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { user } = useAuth();

  // Only show to admin users
  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return null;
  }

  useEffect(() => {
    // Initial load
    refreshMetrics();

    // Set up auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(refreshMetrics, 30000); // Every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    
    try {
      // Get network health
      const networkHealth = networkManager.getNetworkHealth();
      
      // Get upload metrics
      const uploadMetrics = getUploadMetrics();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate upload statistics
      const recentUploads = uploadMetrics.filter(m => 
        new Date(m.uploadStartTime) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      const failedUploads = recentUploads.filter(m => !m.uploadEndTime);
      const completedUploads = recentUploads.filter(m => m.uploadEndTime);
      const avgUploadTime = completedUploads.length > 0 
        ? completedUploads.reduce((sum, m) => sum + (m.uploadEndTime! - m.uploadStartTime), 0) / completedUploads.length
        : 0;

      // Test storage accessibility
      const storageHealth = await testStorageHealth();

      // Mock performance metrics (in a real app, these would come from your monitoring service)
      const performanceMetrics = {
        memoryUsage: Math.random() * 100,
        cpuLoad: Math.random() * 100,
        cacheHitRate: 85 + Math.random() * 10
      };

      const systemMetrics: SystemMetrics = {
        networkHealth: {
          status: networkHealth.isHealthy ? 'healthy' : (networkHealth.circuitBreakerOpen ? 'offline' : 'degraded'),
          failureRate: networkHealth.failureRate * 100,
          avgResponseTime: networkHealth.avgResponseTime,
          activeRequests: networkHealth.activeRequests,
          queuedRequests: networkHealth.queuedRequests
        },
        uploadMetrics: {
          activeUploads: uploadMetrics.filter(m => !m.uploadEndTime).length,
          recentFailures: failedUploads.length,
          avgUploadTime: avgUploadTime,
          totalUploadsToday: recentUploads.length
        },
        storageHealth,
        performanceMetrics
      };

      setMetrics(systemMetrics);

    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      toast.error('Failed to refresh system metrics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const testStorageHealth = async (): Promise<{
    accessible: boolean;
    responseTime: number;
    lastChecked: Date;
  }> => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await networkManager.withNetworkResilience(
        'storage-health-check',
        async () => {
          return await fetch('/api/storage-health', { 
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
        },
        { timeout: 5000, retries: 1 }
      );

      const responseTime = Date.now() - startTime;
      
      return {
        accessible: true,
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        accessible: false,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-orange-600 bg-orange-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertCircle className="h-4 w-4" />;
      case 'offline': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading system metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Activity className="h-5 w-5" />
              Invoice System Monitor
            </CardTitle>
            <CardDescription>
              Real-time monitoring of invoice system health and performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <Button
              onClick={refreshMetrics}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              {isRefreshing ? <Clock className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Network Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Network Health</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(metrics.networkHealth.status)}>
                {getStatusIcon(metrics.networkHealth.status)}
                {metrics.networkHealth.status}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <div>Failure Rate: {metrics.networkHealth.failureRate.toFixed(1)}%</div>
              <div>Avg Response: {metrics.networkHealth.avgResponseTime.toFixed(0)}ms</div>
              <div>Queue: {metrics.networkHealth.queuedRequests} requests</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Upload Status</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.uploadMetrics.activeUploads}
            </div>
            <div className="text-xs text-gray-600">Active uploads</div>
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <div>Today: {metrics.uploadMetrics.totalUploadsToday}</div>
              <div>Failures: {metrics.uploadMetrics.recentFailures}</div>
              <div>Avg Time: {(metrics.uploadMetrics.avgUploadTime / 1000).toFixed(1)}s</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(metrics.storageHealth.accessible ? 'healthy' : 'offline')}>
                {getStatusIcon(metrics.storageHealth.accessible ? 'healthy' : 'offline')}
                {metrics.storageHealth.accessible ? 'Accessible' : 'Offline'}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Response: {metrics.storageHealth.responseTime}ms
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Memory</span>
                  <span>{metrics.performanceMetrics.memoryUsage.toFixed(0)}%</span>
                </div>
                <Progress value={metrics.performanceMetrics.memoryUsage} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>CPU</span>
                  <span>{metrics.performanceMetrics.cpuLoad.toFixed(0)}%</span>
                </div>
                <Progress value={metrics.performanceMetrics.cpuLoad} className="h-1" />
              </div>
            </div>
          </Card>
        </div>

        {/* System Alerts */}
        {(metrics.networkHealth.status !== 'healthy' || 
          metrics.uploadMetrics.recentFailures > 0 || 
          !metrics.storageHealth.accessible) && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-700 dark:text-red-300 text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.networkHealth.status !== 'healthy' && (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <Network className="h-4 w-4" />
                  Network issues detected - uploads may be slower or fail
                </div>
              )}
              {metrics.uploadMetrics.recentFailures > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <FileText className="h-4 w-4" />
                  {metrics.uploadMetrics.recentFailures} upload failures in the last 24 hours
                </div>
              )}
              {!metrics.storageHealth.accessible && (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <HardDrive className="h-4 w-4" />
                  Storage system is not accessible - new uploads will fail
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Performance Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {metrics.networkHealth.failureRate > 10 && (
              <div className="flex items-start gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">High Network Failure Rate</div>
                  <div className="text-yellow-700 dark:text-yellow-300">Consider checking network connectivity or reducing concurrent requests</div>
                </div>
              </div>
            )}
            
            {metrics.uploadMetrics.avgUploadTime > 10000 && (
              <div className="flex items-start gap-2 p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-200">Slow Upload Performance</div>
                  <div className="text-blue-700 dark:text-blue-300">Average upload time is higher than expected - may indicate network or storage issues</div>
                </div>
              </div>
            )}

            {metrics.performanceMetrics.cacheHitRate < 80 && (
              <div className="flex items-start gap-2 p-2 bg-purple-100 dark:bg-purple-900/20 rounded">
                <Zap className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium text-purple-800 dark:text-purple-200">Low Cache Hit Rate</div>
                  <div className="text-purple-700 dark:text-purple-300">Cache performance could be improved for better response times</div>
                </div>
              </div>
            )}

            {metrics.networkHealth.status === 'healthy' && 
             metrics.uploadMetrics.recentFailures === 0 && 
             metrics.storageHealth.accessible && (
              <div className="flex items-start gap-2 p-2 bg-green-100 dark:bg-green-900/20 rounded">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800 dark:text-green-200">System Operating Normally</div>
                  <div className="text-green-700 dark:text-green-300">All systems are healthy and performing well</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default InvoiceSystemMonitor;

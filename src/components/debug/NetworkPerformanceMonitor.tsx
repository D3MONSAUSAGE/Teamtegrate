
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { networkManager } from '@/utils/networkManager';

const NetworkPerformanceMonitor: React.FC = () => {
  const [networkHealth, setNetworkHealth] = useState(networkManager.getNetworkHealth());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkHealth(networkManager.getNetworkHealth());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible && networkHealth.isHealthy) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>
    );
  }

  const getHealthColor = () => {
    if (networkHealth.circuitBreakerOpen) return 'text-red-500';
    if (networkHealth.failureRate > 0.5) return 'text-orange-500';
    if (networkHealth.failureRate > 0.2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getHealthIcon = () => {
    if (networkHealth.circuitBreakerOpen) return <WifiOff className="h-4 w-4" />;
    if (networkHealth.failureRate > 0.3) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Network Performance
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Health */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network Health</span>
          <div className={`flex items-center gap-1 ${getHealthColor()}`}>
            {getHealthIcon()}
            <Badge variant={networkHealth.isHealthy ? 'default' : 'destructive'}>
              {networkHealth.isHealthy ? 'Healthy' : 'Degraded'}
            </Badge>
          </div>
        </div>

        {/* Failure Rate */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Failure Rate</span>
            <span>{(networkHealth.failureRate * 100).toFixed(1)}%</span>
          </div>
          <Progress 
            value={networkHealth.failureRate * 100} 
            className="h-2"
          />
        </div>

        {/* Response Time */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Avg Response Time</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-sm">{networkHealth.avgResponseTime.toFixed(0)}ms</span>
          </div>
        </div>

        {/* Active Requests */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Active Requests</span>
          <Badge variant="outline">
            {networkHealth.activeRequests}
          </Badge>
        </div>

        {/* Queued Requests */}
        {networkHealth.queuedRequests > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Queued Requests</span>
            <Badge variant="secondary">
              {networkHealth.queuedRequests}
            </Badge>
          </div>
        )}

        {/* Circuit Breaker Status */}
        {networkHealth.circuitBreakerOpen && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <WifiOff className="h-4 w-4" />
              Circuit breaker is open - requests blocked
            </div>
          </div>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            networkManager.resetMetrics();
            setNetworkHealth(networkManager.getNetworkHealth());
          }}
          className="w-full"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reset Metrics
        </Button>
      </CardContent>
    </Card>
  );
};

export default NetworkPerformanceMonitor;

import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
}

// KPI Cards Loading
export const KPICardsLoading: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Chart Loading
export const ChartLoading: React.FC<LoadingStateProps & { height?: number }> = ({ 
  className, 
  height = 300 
}) => (
  <Card className={className}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex items-end gap-2" style={{ height }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ 
                height: `${Math.random() * 60 + 40}%`,
                minHeight: '20px'
              }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-12" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Table Loading
export const TableLoading: React.FC<LoadingStateProps & { 
  rows?: number;
  columns?: number;
}> = ({ 
  className, 
  rows = 5,
  columns = 4
}) => (
  <Card className={className}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {/* Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Analytics Dashboard Full Loading
export const AnalyticsDashboardLoading: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn("space-y-6", className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>

    {/* KPI Cards */}
    <KPICardsLoading />

    {/* Charts Row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartLoading height={250} />
      <ChartLoading height={250} />
    </div>

    {/* Insights & Performance */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Upload Progress Loading
export const UploadProgressLoading: React.FC<LoadingStateProps & { files?: number }> = ({ 
  className,
  files = 3
}) => (
  <Card className={className}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: files }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Performance Charts Loading  
export const PerformanceChartsLoading: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn("space-y-6", className)}>
    {/* Overview Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Chart Tabs */}
    <Card>
      <CardHeader>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartLoading height={280} />
          <ChartLoading height={280} />
        </div>
      </CardContent>
    </Card>
  </div>
);

// Floating Action Loading
export const FloatingActionLoading: React.FC<LoadingStateProps> = ({ className }) => (
  <div className={cn("fixed bottom-6 right-6 space-y-2", className)}>
    <Skeleton className="h-12 w-12 rounded-full" />
    <Skeleton className="h-10 w-10 rounded-full" />
    <Skeleton className="h-10 w-10 rounded-full" />
  </div>
);

export default {
  KPICardsLoading,
  ChartLoading,
  TableLoading,
  AnalyticsDashboardLoading,
  UploadProgressLoading,
  PerformanceChartsLoading,
  FloatingActionLoading
};
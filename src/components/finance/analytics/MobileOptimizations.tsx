import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, ChevronLeft, ChevronRight, MoreVertical, TrendingUp, DollarSign, Users, Target, Smartphone } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileMetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  className?: string;
}

export const MobileMetricCard: React.FC<MobileMetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  subtitle,
  className
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-shrink-0">
            {icon}
          </div>
          {change !== undefined && (
            <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'} className="text-xs">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className={cn("text-xs", getTrendColor())}>{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface MobileChartContainerProps {
  title: string;
  children: React.ReactNode;
  height?: number;
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const MobileChartContainer: React.FC<MobileChartContainerProps> = ({
  title,
  children,
  height = 200,
  fullScreen = false,
  onToggleFullScreen
}) => {
  const isMobile = useIsMobile();
  
  if (fullScreen && isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onToggleFullScreen}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-4">
            <div style={{ height: 'calc(100vh - 120px)' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {isMobile && onToggleFullScreen && (
            <Button variant="ghost" size="sm" onClick={onToggleFullScreen}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

interface SwipeableCarouselProps {
  items: React.ReactNode[];
  className?: string;
  showDots?: boolean;
}

export const SwipeableCarousel: React.FC<SwipeableCarouselProps> = ({
  items,
  className,
  showDots = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {item}
          </div>
        ))}
      </div>

      {showDots && items.length > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-primary" : "bg-muted"
              )}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
      
      {items.length > 1 && (
        <div className="absolute inset-y-0 left-2 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {items.length > 1 && (
        <div className="absolute inset-y-0 right-2 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
            disabled={currentIndex === items.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

interface MobileDashboardProps {
  metrics: Array<{
    title: string;
    value: string;
    change?: number;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
  }>;
  charts: Array<{
    title: string;
    component: React.ReactNode;
  }>;
  className?: string;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  metrics,
  charts,
  className
}) => {
  const isMobile = useIsMobile();
  const [fullScreenChart, setFullScreenChart] = useState<number | null>(null);

  if (!isMobile) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Desktop layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <MobileMetricCard key={index} {...metric} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {charts.map((chart, index) => (
            <MobileChartContainer key={index} title={chart.title} height={300}>
              {chart.component}
            </MobileChartContainer>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile Metrics Carousel */}
      <SwipeableCarousel
        items={metrics.map((metric, index) => (
          <div key={index} className="px-2">
            <MobileMetricCard {...metric} />
          </div>
        ))}
        className="mb-6"
      />

      {/* Mobile Charts */}
      <div className="space-y-4">
        {charts.map((chart, index) => (
          <MobileChartContainer
            key={index}
            title={chart.title}
            height={250}
            fullScreen={fullScreenChart === index}
            onToggleFullScreen={() => 
              setFullScreenChart(fullScreenChart === index ? null : index)
            }
          >
            {chart.component}
          </MobileChartContainer>
        ))}
      </div>
    </div>
  );
};

interface MobileNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
  }>;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onTabChange,
  tabs
}) => {
  const isMobile = useIsMobile();
  
  if (!isMobile) {
    return (
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={currentTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-2"
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="h-4 w-4 mr-2" />
          {tabs.find(tab => tab.id === currentTab)?.label || 'Menu'}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Select a section to view
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={currentTab === tab.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onTabChange(tab.id)}
            >
              <div className="flex items-center gap-3 w-full">
                {tab.icon}
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Mobile-optimized chart components
export const MobileLineChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
      <XAxis 
        dataKey="date" 
        tick={{ fontSize: 10 }}
        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}
      />
      <YAxis tick={{ fontSize: 10 }} />
      <Tooltip 
        labelFormatter={(value) => new Date(value).toLocaleDateString()}
        contentStyle={{ fontSize: '12px' }}
      />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke="#6366F1" 
        strokeWidth={2}
        dot={{ r: 3 }}
        activeDot={{ r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

export const MobileBarChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
      <XAxis 
        dataKey="name" 
        tick={{ fontSize: 10 }}
        angle={-45}
        textAnchor="end"
        height={50}
      />
      <YAxis tick={{ fontSize: 10 }} />
      <Tooltip contentStyle={{ fontSize: '12px' }} />
      <Bar dataKey="value" fill="#6366F1" radius={[2, 2, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const MobilePieChart: React.FC<{ data: any[] }> = ({ data }) => {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981'];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={60}
          dataKey="value"
          label={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default {
  MobileMetricCard,
  MobileChartContainer,
  SwipeableCarousel,
  MobileDashboard,
  MobileNavigation,
  MobileLineChart,
  MobileBarChart,
  MobilePieChart
};
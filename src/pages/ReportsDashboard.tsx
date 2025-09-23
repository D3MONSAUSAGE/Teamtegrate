import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  CheckSquare, 
  DollarSign, 
  Users, 
  GraduationCap,
  ClipboardList,
  Send,
  FolderOpen,
  TrendingUp,
  Clock,
  Target,
  ArrowRight
} from 'lucide-react';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: string;
  isComingSoon?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  badge,
  isComingSoon = false 
}) => {
  if (isComingSoon) {
    return (
      <div className="group">
        <Card className="opacity-60 cursor-not-allowed hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              {badge && (
                <span className="text-xs px-2 py-1 bg-gradient-to-r from-primary/10 to-accent/10 text-primary rounded-full font-medium">
                  {badge}
                </span>
              )}
              <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                Coming Soon
              </span>
            </div>
            <CardTitle className="text-lg">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-sm mb-3">{description}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Link to={href} className="group">
      <Card className="cursor-pointer hover:border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {badge && (
              <span className="text-xs px-2 py-1 bg-gradient-to-r from-primary/10 to-accent/10 text-primary rounded-full font-medium">
                {badge}
              </span>
            )}
          </div>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm mb-3">{description}</p>
          <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
            View Reports <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const ReportsDashboard: React.FC = () => {
  const { user } = useAuth();

  const quickMetrics = [
    { label: 'Total Tasks', value: '247', icon: CheckSquare, trend: '+12%' },
    { label: 'Active Projects', value: '8', icon: FolderOpen, trend: '+2' },
    { label: 'Team Members', value: '24', icon: Users, trend: '+3' },
    { label: 'Completion Rate', value: '94%', icon: TrendingUp, trend: '+5%' }
  ];

  const reportCategories = [
    {
      title: 'Task & Performance Reports',
      description: 'Track task completion, team performance, and productivity metrics',
      icon: BarChart3,
      href: '/dashboard/reports/tasks',
      badge: 'Updated'
    },
    {
      title: 'Checklist Compliance',
      description: 'Monitor checklist execution, verification scores, and compliance trends',
      icon: ClipboardList,
      href: '/dashboard/reports/checklists',
      isComingSoon: true
    },
    {
      title: 'Request Analytics',
      description: 'Analyze request processing times, approval rates, and bottlenecks',
      icon: Send,
      href: '/dashboard/reports/requests',
      isComingSoon: true
    },
    {
      title: 'Training Progress',
      description: 'Track training completion, skill development, and certification status',
      icon: GraduationCap,
      href: '/dashboard/reports/training',
      isComingSoon: true
    },
    {
      title: 'Financial Reports',
      description: 'Revenue analysis, cost tracking, and budget performance insights',
      icon: DollarSign,
      href: '/dashboard/reports/financial',
      isComingSoon: true
    },
    {
      title: 'Project Reports',
      description: 'Project timeline analysis, resource utilization, and delivery metrics',
      icon: FolderOpen,
      href: '/dashboard/reports/projects',
      isComingSoon: true
    },
    {
      title: 'Team Analytics',
      description: 'Team performance, workload distribution, and collaboration insights',
      icon: Users,
      href: '/dashboard/reports/teams',
      isComingSoon: true
    },
    {
      title: 'Time Utilization',
      description: 'Time tracking analysis, productivity patterns, and efficiency metrics',
      icon: Clock,
      href: '/dashboard/reports/time',
      isComingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Reports Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights and analytics for your organization
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickMetrics.map((metric, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {metric.value}
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      {metric.trend}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
                    <metric.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Categories */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Report Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reportCategories.map((category, index) => (
              <ReportCard
                key={index}
                title={category.title}
                description={category.description}
                icon={category.icon}
                href={category.href}
                badge={category.badge}
                isComingSoon={category.isComingSoon}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recent Report Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="font-medium">Task Performance Report</span>
                </div>
                <span className="text-sm text-muted-foreground">Generated 2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">Team Productivity Analysis</span>
                </div>
                <span className="text-sm text-muted-foreground">Generated yesterday</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span className="font-medium">Weekly Checklist Summary</span>
                </div>
                <span className="text-sm text-muted-foreground">Generated 3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsDashboard;
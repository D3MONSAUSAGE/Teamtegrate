
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminMetricsCards: React.FC = () => {
  const metrics = [
    {
      title: "RLS Security",
      value: "Active",
      description: "Row Level Security enabled",
      icon: Shield,
      status: "success" as const,
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Organization Isolation", 
      value: "Secured",
      description: "Multi-tenant data separation",
      icon: Database,
      status: "success" as const,
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Access Control",
      value: "Enforced", 
      description: "Role-based permissions active",
      icon: Users,
      status: "success" as const,
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Migration Status",
      value: "Complete",
      description: "All data properly organized",
      icon: CheckCircle,
      status: "success" as const,
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">✅ Active</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">⚠️ Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${metric.bgColor} border border-border/60 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20`}>
                      <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </div>
                      <div className="text-lg font-bold">
                        {metric.value}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(metric.status)}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {metric.description}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AdminMetricsCards;


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TestTube, 
  Database, 
  Users, 
  RefreshCw, 
  Download,
  Settings,
  BarChart3,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminQuickActionsProps {
  onRunAudit?: () => void;
  onRunRLSTest?: () => void;
  onRefreshData?: () => void;
}

const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({
  onRunAudit,
  onRunRLSTest,
  onRefreshData
}) => {
  const quickActions = [
    {
      title: "Run Security Test",
      description: "Test all RLS policies",
      icon: TestTube,
      action: onRunRLSTest,
      variant: "default" as const,
      color: "text-primary"
    },
    {
      title: "Data Audit",
      description: "Check data integrity", 
      icon: Database,
      action: onRunAudit,
      variant: "secondary" as const,
      color: "text-blue-600"
    },
    {
      title: "Refresh System",
      description: "Reload all data",
      icon: RefreshCw,
      action: onRefreshData,
      variant: "outline" as const,
      color: "text-green-600"
    },
    {
      title: "Export Report",
      description: "Download audit report",
      icon: Download,
      action: () => console.log('Export report'),
      variant: "outline" as const,
      color: "text-purple-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Frequently used administrative tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant={action.variant}
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-200"
                  onClick={action.action}
                >
                  <Icon className={`h-5 w-5 ${action.color}`} />
                  <div className="text-center">
                    <div className="text-sm font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminQuickActions;
